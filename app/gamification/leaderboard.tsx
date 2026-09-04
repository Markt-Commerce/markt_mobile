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
                className={`font-bold text-xs ${
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
      <View className="flex-row items-center px-4 h-12">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`text-[17px] font-bold ml-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
        >
          Leaderboard
        </Text>
      </View>

      {/* Controls */}
      <View className="px-5 pt-1">
        <LeaderboardScopeTabs scope={scope} onChange={setScope} />
        <PeriodToggle />
      </View>

      {/* Your standing, with the rank as the number that leads. It was a flat
          orange bar with two same-weight strings pushed to opposite edges, so
          nothing read first. */}
      {yourRank && (
        <View className="px-5 pt-4">
          <View className="rounded-2xl px-4 py-3.5 flex-row items-center bg-primary">
            <View>
              <Text className="text-white/75 text-[11px] font-bold uppercase tracking-[1.5px]">
                Your rank
              </Text>
              <View className="flex-row items-baseline mt-0.5">
                <Text className="text-white text-[26px] font-bold">
                  #{yourRank.rank}
                </Text>
                <Text className="text-white/75 text-[13px] ml-1.5">
                  of {yourRank.out_of.toLocaleString()}
                </Text>
              </View>
            </View>
            <View className="ml-auto items-end">
              <Text className="text-white text-[18px] font-bold">
                {yourRank.points.toLocaleString()}
              </Text>
              <Text className="text-white/75 text-[11px]">pts</Text>
            </View>
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
              className={`text-center text-sm py-16 ${
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
