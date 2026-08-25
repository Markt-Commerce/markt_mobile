import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "../../components/themeProvider";
import { getPointsHistory } from "../../services/sections/gamification";
import { reasonLabel } from "../../utils/gamification";
import type { PointsHistoryItem } from "../../types/gamification";

export default function PointsHistoryScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [items, setItems] = useState<PointsHistoryItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const busy = useRef(false);

  const fetchPage = useCallback(async (reset: boolean, atCursor: number | null) => {
    if (busy.current) return;
    busy.current = true;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await getPointsHistory(reset ? null : atCursor, 20);
      setItems((prev) => {
        const next = reset ? res.items : [...prev, ...res.items];
        const seen = new Set<number>();
        return next.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
      });
      setCursor(res.next_cursor);
      setHasMore(res.next_cursor != null);
    } catch {
      // keep whatever we have
    } finally {
      setLoading(false);
      setLoadingMore(false);
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPage(true, null);
  }, [fetchPage]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}
      edges={["top", "bottom"]}
    >
      <View
        className={`flex-row items-center px-4 py-3 border-b ${
          isDark ? "border-[#46464e]" : "border-border"
        }`}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ml-2 ${
            isDark ? "text-[#f0f1f2]" : "text-black"
          }`}
        >
          Points History
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View
            className={`flex-row items-center justify-between px-6 py-4 border-b ${
              isDark ? "border-[#46464e]" : "border-border"
            }`}
          >
            <View className="flex-1 pr-3">
              <Text
                className={`font-bold text-sm ${
                  isDark ? "text-[#f0f1f2]" : "text-black"
                }`}
              >
                {reasonLabel(item.reason)}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  isDark ? "text-[#c6c5cf]" : "text-tertiary"
                }`}
              >
                {formatDate(item.created_at)} · balance {item.balance_after.toLocaleString()}
              </Text>
            </View>
            <Text
              className={`font-bold text-base ${
                item.delta >= 0 ? "text-success" : "text-error"
              }`}
            >
              {item.delta >= 0 ? "+" : ""}
              {item.delta}
            </Text>
          </View>
        )}
        onEndReached={() => hasMore && !loadingMore && fetchPage(false, cursor)}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchPage(true, null)}
            tintColor={isDark ? "#f0f1f2" : "#000000"}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={isDark ? "#f0f1f2" : "#000000"} />
            </View>
          ) : (
            <Text
              className={`text-center text-sm py-16 ${
                isDark ? "text-[#c6c5cf]" : "text-tertiary"
              }`}
            >
              No points yet.
            </Text>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={isDark ? "#f0f1f2" : "#000000"}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
