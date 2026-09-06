/**
 * Markets — list of active markets. Tap one to browse its sellers/products/posts.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Store, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMarkets } from "../../services/sections/markets";
import type { Market } from "../../services/sections/markets";
import { useTokens } from "../../theme/useTokens";

export default function MarketsScreen() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useTokens();

  useEffect(() => {
    let cancelled = false;
    getMarkets()
      .then((res) => {
        if (!cancelled) setMarkets(res.markets ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-surface-page"
      edges={["top"]}
    >
      <View
        className="flex-row items-center px-6 py-4 border-b border-border"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={t.textPrimary} />
        </TouchableOpacity>
        <Text
          className="flex-1 text-xl font-bold text-center pr-8 text-text-primary"
        >
          Markets
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator
            size="large"
            color={t.textPrimary}
          />
          <Text
            className="text-text-secondary text-sm mt-2"
          >
            Loading markets...
          </Text>
        </View>
      ) : error || markets.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text
            className="font-semibold text-lg text-center text-text-primary"
          >
            {error ? "Could not load markets" : "No markets yet"}
          </Text>
          <Text
            className="text-text-secondary text-sm mt-2 text-center"
          >
            {error
              ? "Please try again later."
              : "Check back soon — markets are added as they open up."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={markets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/markets/${item.id}`)}
              className="flex-row items-center px-6 py-4 border-b bg-surface-page border-border"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.name}`}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center bg-media"
              >
                <Store size={22} color={t.primaryText} strokeWidth={2} />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  className="font-bold text-base text-text-primary"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  className="text-text-secondary text-xs mt-1"
                >
                  {item.seller_count} seller{item.seller_count !== 1 ? "s" : ""}
                </Text>
              </View>
              <ChevronRight size={20} color={t.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
