/**
 * Requests — My requests (buyer) | Browse requests (buyer + seller)
 */

import React, { useCallback, useEffect, useState } from "react";
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
import { FileText, Plus, Search, Sparkles } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import { getBuyerRequests } from "../../services/sections/feed";
import { BuyerRequest } from "../../models/feed";
import RequestDisplayComponent from "../../components/requestDisplayComponent";
import { useTheme } from "../../components/themeProvider";

function RequestTabPill({
  label,
  active,
  onPress,
  isDark,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-1 h-11 rounded items-center justify-center ${active ? "bg-primary" : "bg-transparent"}`}
    >
      <Text
        className={`font-geist font-bold text-[11px] tracking-[2px] uppercase ${
          active ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyRequestsState({
  title,
  description,
  actionLabel,
  onAction,
  isDark,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  isDark: boolean;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className={`w-24 h-24 rounded items-center justify-center mb-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
        <View className={`w-16 h-16 rounded items-center justify-center border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <FileText size={28} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.8} />
        </View>
      </View>
      <Text className={`text-2xl font-geist font-bold text-center tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        {title}
      </Text>
      <Text className={`font-inter text-base text-center mt-3 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
        {description}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        activeOpacity={0.85}
        className="mt-8 h-12 px-7 rounded bg-primary items-center justify-center flex-row gap-2"
      >
        <Sparkles size={16} color="#FFFFFF" strokeWidth={2} />
        <Text className="text-white font-geist font-bold text-[11px] tracking-[2px] uppercase">
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [tab, setTab] = useState<"my" | "browse">(role === "buyer" ? "my" : "browse");
  const [items, setItems] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getBuyerRequests(1, 20);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handlePrimaryAction = () => {
    router.push("/(tabs)");
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`mt-4 font-geist font-bold text-[11px] tracking-[2px] uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Loading requests
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      <View className={`px-6 pt-5 pb-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className={`font-geist font-bold text-[28px] tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Requests
            </Text>
            <Text className={`font-inter text-sm mt-1 leading-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Track buyer intent, discover open requests, and keep the flow clean.
            </Text>
          </View>
          <View className={`w-14 h-14 rounded items-center justify-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <Plus size={24} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2.2} />
          </View>
        </View>

        <View className={`mt-4 rounded border p-1 flex-row ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
          {role === "buyer" && (
            <RequestTabPill label="My Requests" active={tab === "my"} onPress={() => setTab("my")} isDark={isDark} />
          )}
          <RequestTabPill label="Browse" active={tab === "browse"} onPress={() => setTab("browse")} isDark={isDark} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestDisplayComponent req={item} />}
        ListHeaderComponent={
          <View className="px-6 pt-5 pb-2">
            <View className="flex-row items-center justify-between">
              <Text className={`text-[11px] font-geist font-bold tracking-[2px] uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {tab === "my" ? "Your request board" : "Open requests"}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Search size={14} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2} />
                <Text className={`text-[11px] font-geist font-bold tracking-[2px] uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  Fresh
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyRequestsState
            title={tab === "my" ? "No requests yet" : "No open requests"}
            description={
              tab === "my" && role === "buyer"
                ? "Create a request to tell sellers what you need and let the right offers come to you."
                : "Check back later for active buyer requests that match your category."
            }
            actionLabel={tab === "my" && role === "buyer" ? "Create request" : "Browse feed"}
            onAction={handlePrimaryAction}
            isDark={isDark}
          />
        }
        ListFooterComponent={<View className="h-8" />}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />
        }
      />
    </SafeAreaView>
  );
}
