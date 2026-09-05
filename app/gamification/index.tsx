import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";

import { useTheme } from "../../components/themeProvider";
import { useUser } from "../../hooks/userContextProvider";
import { useGamificationContext } from "../../hooks/gamificationContext";
import { getPointsHistory, getLeaderboard } from "../../services/sections/gamification";
import TierBadge from "../../components/gamification/TierBadge";
import TierProgressBar from "../../components/gamification/TierProgressBar";
import BadgeGrid from "../../components/gamification/BadgeGrid";
import LeaderboardRow from "../../components/gamification/LeaderboardRow";
import { reasonLabel } from "../../utils/gamification";
import type { PointsHistoryItem, LeaderboardRow as LBRow } from "../../types/gamification";

export default function GamificationScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user } = useUser();
  const isDark = resolvedTheme === "dark";

  const { profile: data, badges, loading, error, refresh, refreshBadges } = useGamificationContext();

  const [recent, setRecent] = useState<PointsHistoryItem[]>([]);
  const [preview, setPreview] = useState<LBRow[]>([]);

  const loadExtras = useCallback(async () => {
    try {
      const [hist, lb] = await Promise.all([
        getPointsHistory(null, 5),
        getLeaderboard({ scope: "global", period: "weekly", limit: 3 }),
      ]);
      setRecent(hist.items);
      setPreview(lb.items);
    } catch {
      // Non-fatal; the hero/badges still render.
    }
  }, []);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  const onRefresh = useCallback(() => {
    refresh();
    refreshBadges();
    loadExtras();
  }, [refresh, refreshBadges, loadExtras]);

  // Realtime points/badge/tier updates are handled globally by
  // GamificationProvider (toast + celebratory modals); this screen just
  // re-reads the shared, already-live profile/badges data.

  return (
    <SafeAreaView
      className="flex-1 bg-surface-page"
      edges={["top", "bottom"]}
    >
      <View
        className={`flex-row items-center px-4 py-3 border-b ${
          isDark ? "border-border-strong" : "border-border"
        }`}
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ml-2 ${
            isDark ? "text-text-primary" : "text-black"
          }`}
        >
          Your Progress
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={isDark ? "#f0f1f2" : "#000000"}
          />
        }
      >
        {error && !data ? (
          <View className="items-center py-16 px-6">
            <Text
              className={`text-sm text-center ${
                isDark ? "text-text-secondary" : "text-tertiary"
              }`}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="mt-3 px-5 py-2 bg-primary rounded"
            >
              <Text className="text-white font-bold text-sm">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color={isDark ? "#f0f1f2" : "#000000"} />
          </View>
        ) : (
          <>
            {/* Hero */}
            <View className="px-6 pt-6">
              <View
                className={`rounded border p-6 ${
                  isDark ? "bg-surface-sunken border-border-strong" : "bg-white border-border"
                }`}
              >
                <TierBadge
                  tier={data.tier.key}
                  stars={data.tier.stars}
                  name={data.tier.name}
                  colorHex={data.tier.color_hex}
                  size="lg"
                  showName
                />
                <Text
                  className={`font-bold text-[40px] mt-4 ${
                    isDark ? "text-text-primary" : "text-black"
                  }`}
                >
                  {data.lifetime_points.toLocaleString()}
                </Text>
                <Text
                  className={`text-xs -mt-1 mb-4 ${
                    isDark ? "text-text-secondary" : "text-tertiary"
                  }`}
                >
                  lifetime points
                </Text>
                <TierProgressBar
                  progress={data.tier.progress_to_next}
                  pointsToNext={data.tier.points_to_next_tier}
                  nextTierName={null}
                  colorHex={data.tier.color_hex}
                />
              </View>
            </View>

            {/* Quick stats */}
            <View className="flex-row gap-3 px-6 pt-4">
              <StatTile
                label="This week"
                value={data.weekly_points.toLocaleString()}
                isDark={isDark}
              />
              <StatTile
                label="Badges"
                value={`${data.badges_earned}/${data.badges_total}`}
                isDark={isDark}
              />
              <StatTile
                label="Rank"
                value={data.weekly_rank ? `#${data.weekly_rank.rank}` : "—"}
                isDark={isDark}
              />
            </View>

            {/* Recent activity */}
            <SectionHeader
              title="Recent activity"
              actionLabel="See all"
              onAction={() => router.push("/gamification/points-history")}
              isDark={isDark}
            />
            <View className="px-6">
              {recent.length === 0 ? (
                <Text
                  className={`text-sm ${
                    isDark ? "text-text-secondary" : "text-tertiary"
                  }`}
                >
                  No activity yet — earn points by buying, selling and posting.
                </Text>
              ) : (
                recent.map((r) => (
                  <View
                    key={r.id}
                    className={`flex-row items-center justify-between py-3 border-b ${
                      isDark ? "border-border-strong" : "border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isDark ? "text-text-primary" : "text-black"
                      }`}
                    >
                      {reasonLabel(r.reason)}
                    </Text>
                    <Text
                      className={`font-bold text-sm ${
                        r.delta >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {r.delta >= 0 ? "+" : ""}
                      {r.delta}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Badges */}
            <SectionHeader title="Badges" isDark={isDark} />
            <View className="px-6">
              <BadgeGrid
                badges={badges}
                onBadgePress={(b) => router.push(`/gamification/badge/${b.slug}`)}
              />
            </View>

            {/* Leaderboard preview */}
            <SectionHeader
              title="Leaderboard"
              actionLabel="Open"
              onAction={() => router.push("/gamification/leaderboard")}
              isDark={isDark}
            />
            <View
              className={`mx-6 rounded border overflow-hidden ${
                isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"
              }`}
            >
              {preview.length === 0 ? (
                <Text
                  className={`text-sm p-4 ${
                    isDark ? "text-text-secondary" : "text-tertiary"
                  }`}
                >
                  Leaderboard is warming up.
                </Text>
              ) : (
                preview.map((row) => (
                  <LeaderboardRow
                    key={row.user_id}
                    row={row}
                    isCurrentUser={row.user_id === user?.user_id}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded border p-4 ${
        isDark ? "bg-surface-sunken border-border-strong" : "bg-white border-border"
      }`}
    >
      <Text
        className={`text-[10px] font-bold uppercase tracking-wider ${
          isDark ? "text-text-secondary" : "text-tertiary"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-lg font-bold mt-1 ${
          isDark ? "text-text-primary" : "text-black"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
  isDark,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-8 pb-3">
      <Text
        className={`text-xl font-bold ${
          isDark ? "text-text-primary" : "text-black"
        }`}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} className="flex-row items-center">
          <Text className="text-primary font-bold text-sm">{actionLabel}</Text>
          <ChevronRight size={16} color="#E94C2A" />
        </TouchableOpacity>
      )}
    </View>
  );
}
