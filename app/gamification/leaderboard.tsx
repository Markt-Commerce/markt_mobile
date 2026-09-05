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

  const firstPlace = rows.find((row) => row.rank === 1);
  const pointsToFirst = firstPlace
    ? Math.max(0, firstPlace.points - (yourRank?.points ?? 0))
    : 0;

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
              className={`px-4 py-2 rounded-full border ${
                active
                  ? isDark
                    ? "bg-[#4a2d25] border-[#784637]"
                    : "bg-[#fdf0eb] border-[#fdf0eb]"
                  : isDark
                  ? "bg-surface-sunken border-border-strong"
                  : "bg-white border-[#e6e0dd]"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  active
                    ? isDark
                      ? "text-[#ffd5c7]"
                      : "text-[#a63d22]"
                    : isDark
                    ? "text-text-secondary"
                    : "text-[#3a302c]"
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
      className="flex-1 bg-surface-page"
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
          className={`text-[17px] font-bold ml-3 text-text-primary`}
        >
          Leaderboard
        </Text>
      </View>

      {/* Controls */}
      <View className="px-5 pt-1">
        <LeaderboardScopeTabs scope={scope} onChange={setScope} />
        <PeriodToggle />
      </View>

      {yourRank && (
        <View className="px-3.5 pt-4">
          <View
            className={`rounded-2xl px-4 py-3.5 flex-row items-center border ${
              isDark ? "bg-[#34231f] border-[#784637]" : "bg-[#fff1eb] border-[#f7bca9]"
            }`}
          >
            <View>
              <Text
                className={`text-[12px] font-medium uppercase tracking-[0.3px] ${
                  isDark ? "text-[#ffd5c7]" : "text-[#9e3b22]"
                }`}
              >
                Your position
              </Text>
              <View className="flex-row items-baseline mt-0.5">
                <Text
                  className={`text-[28px] font-bold ${
                    isDark ? "text-[#ffd5c7]" : "text-[#9e3b22]"
                  }`}
                >
                  #{yourRank.rank}
                </Text>
                <Text
                  className={`text-[14px] ml-1.5 ${
                    isDark ? "text-[#e2afa0]" : "text-[#a94a31]"
                  }`}
                >
                  of {yourRank.out_of.toLocaleString()}
                </Text>
                <View
                  className={`ml-2 rounded-full px-2 py-0.5 ${
                    isDark ? "bg-[#25413a]" : "bg-[#e4f5ef]"
                  }`}
                >
                  <Text className={`text-[12px] ${isDark ? "text-[#b8e8d5]" : "text-[#18805d]"}`}>
                    ↑ 1
                  </Text>
                </View>
              </View>
            </View>
            <View className="ml-auto items-end">
              <Text
                className={`text-[14px] font-medium ${
                  isDark ? "text-[#ffd5c7]" : "text-[#9e3b22]"
                }`}
              >
                {pointsToFirst.toLocaleString()} pts to #1
              </Text>
              <Text className={`text-[14px] ${isDark ? "text-[#e2afa0]" : "text-[#a94a31]"}`}>
                Keep it going this week
              </Text>
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
                isDark ? "text-text-secondary" : "text-tertiary"
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
