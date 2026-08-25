import React from "react";
import { View, Text } from "react-native";
import BadgeCard from "./BadgeCard";
import { useTheme } from "../themeProvider";
import type { UserBadge } from "../../types/gamification";

export interface BadgeGridProps {
  badges: UserBadge[];
  onBadgePress?: (badge: UserBadge) => void;
  columns?: number;
  className?: string;
}

/** Responsive locked/unlocked badge grid. */
export default function BadgeGrid({
  badges,
  onBadgePress,
  columns = 3,
  className = "",
}: BadgeGridProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!badges.length) {
    return (
      <Text
        className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
      >
        No badges yet.
      </Text>
    );
  }

  const widthPct = `${100 / columns}%` as `${number}%`;

  return (
    <View className={`flex-row flex-wrap -mx-1.5 ${className}`}>
      {badges.map((b) => (
        <View key={b.slug} style={{ width: widthPct }} className="px-1.5 mb-3">
          <BadgeCard
            badge={b}
            earned={b.earned}
            progress={b.progress}
            onPress={onBadgePress ? () => onBadgePress(b) : undefined}
          />
        </View>
      ))}
    </View>
  );
}
