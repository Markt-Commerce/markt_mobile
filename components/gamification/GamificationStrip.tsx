import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../themeProvider";
import TierBadge from "./TierBadge";
import TierProgressBar from "./TierProgressBar";
import BadgeCard from "./BadgeCard";
import type { GamMe, UserBadge } from "../../types/gamification";

export interface GamificationStripProps {
  profile: GamMe;
  badges: UserBadge[];
  onPress?: () => void;
  onBadgePress?: (badge: UserBadge) => void;
  className?: string;
}

/**
 * Compact tier/points/badges summary for the user's own profile tab. Reuses
 * the same TierBadge/TierProgressBar/BadgeCard pieces as the gamification
 * hub — pure presentational, data comes from GamificationProvider.
 */
export default function GamificationStrip({
  profile,
  badges,
  onPress,
  onBadgePress,
  className = "",
}: GamificationStripProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const preview = badges.filter((b) => b.earned).slice(0, 5);

  return (
    <View
      className={`border rounded px-5 py-5 ${
        isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
      } ${className}`}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View className="flex-row items-center justify-between">
          <TierBadge
            tier={profile.tier.key}
            stars={profile.tier.stars}
            name={profile.tier.name}
            colorHex={profile.tier.color_hex}
            size="lg"
            showName
          />
          <Text className={`font-geist font-bold text-[24px] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {profile.lifetime_points.toLocaleString()}
          </Text>
        </View>
        <TierProgressBar
          progress={profile.tier.progress_to_next}
          pointsToNext={profile.tier.points_to_next_tier}
          nextTierName={null}
          colorHex={profile.tier.color_hex}
          className="mt-4"
        />
      </TouchableOpacity>

      {preview.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {preview.map((b) => (
            <BadgeCard
              key={b.slug}
              badge={b}
              earned={b.earned}
              progress={b.progress}
              onPress={() => onBadgePress?.(b)}
              className="w-20"
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
