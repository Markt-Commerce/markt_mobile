import React, { useCallback } from "react";
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
import { useUser } from "../../hooks/userContextProvider";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import LeaderboardScopeTabs from "../../components/gamification/LeaderboardScopeTabs";
import LeaderboardRow from "../../components/gamification/LeaderboardRow";
import type { LeaderboardPeriod } from "../../types/gamification";

export default function LeaderboardScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user } = useUser();
  const isDark = resolvedTheme === "dark";

  const {
    scope,
    period,
    setScope,
    setPeriod,
    rows,
    yourRank,
    hasMore,
    loading,
    loadingMore,
    refresh,
    loadMore,
  } = useLeaderboard("global", "weekly");

  const PeriodToggle = useCallback(() => {
    const options: { id: LeaderboardPeriod; label: string }[] = [
      { id: "weekly", label: "This week" },
      { id: "alltime", label: "All time" },
    ];
    return (
      <View className="flex-row gap-2 mt-3">
        {options.map((o) => {
          const active = period === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              onPress={() => setPeriod(o.id)}
              className={`px-4 py-2 rounded border ${
                active
                  ? "bg-primary border-primary"
                  : isDark
                  ? "bg-[#2f3132] border-[#46464e]"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`font-geist font-bold text-xs ${
                  active ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"
                }`}
              >
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [period, isDark, setPeriod]);

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
          className={`text-lg font-geist font-bold ml-2 ${
            isDark ? "text-[#f0f1f2]" : "text-black"
          }`}
        >
          Leaderboard
        </Text>
      </View>

      {/* Controls */}
      <View className="px-6 pt-4">
        <LeaderboardScopeTabs scope={scope} onChange={setScope} />
        <PeriodToggle />
      </View>

      {/* Sticky your-rank */}
      {yourRank && (
        <View className="px-6 pt-4">
          <View
            className="rounded p-4 flex-row items-center justify-between"
            style={{ backgroundColor: "#E94C2A" }}
          >
            <Text className="text-white font-geist font-bold text-sm">
              Your rank · #{yourRank.rank}
              <Text className="font-inter"> of {yourRank.out_of.toLocaleString()}</Text>
            </Text>
            <Text className="text-white font-geist font-bold text-sm">
              {yourRank.points.toLocaleString()} pts
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(r) => r.user_id}
        renderItem={({ item }) => (
          <LeaderboardRow row={item} isCurrentUser={item.user_id === user?.user_id} />
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
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
              className={`text-center font-inter text-sm py-16 ${
                isDark ? "text-[#c6c5cf]" : "text-tertiary"
              }`}
            >
              No one on this leaderboard yet.
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
