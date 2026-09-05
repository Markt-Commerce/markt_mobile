import React from "react";
import { View, Text, Image } from "react-native";
import TierBadge from "./TierBadge";
import { useTheme } from "../themeProvider";
import type { LeaderboardRow as Row, TierKey } from "../../types/gamification";

export interface LeaderboardRowProps {
  row: Row;
  isCurrentUser?: boolean;
  className?: string;
}

/**
 * Top three get a tinted rank disc rather than an emoji medal.
 *
 * 🥇🥈🥉 render at wildly different sizes across platforms and fonts, don't
 * inherit the theme, and read as a placeholder. A coloured disc holding the
 * actual number keeps the rank legible and still marks the podium.
 *
 * Returns [background, text] for the rank disc, or null for everyone else.
 */
function podium(rank: number): [string, string] | null {
  if (rank === 1) return ["#F5C518", "#3F2E00"]; // gold
  if (rank === 2) return ["#C9CDD2", "#2B2F33"]; // silver
  if (rank === 3) return ["#D08A54", "#3A2109"]; // bronze
  return null;
}

/** Avatar + name + tier stars + points, one leaderboard entry. */
export default function LeaderboardRow({
  row,
  isCurrentUser = false,
  className = "",
}: LeaderboardRowProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const name = row.username ?? "User";
  const podiumColors = podium(row.rank);

  return (
    <View
      accessibilityLabel={`Rank ${row.rank}, ${name}, ${row.points} points`}
      className={`flex-row items-center px-4 py-3 border-b ${
        isDark ? "border-border" : "border-border-light"
      } ${
        isCurrentUser ? (isDark ? "bg-surface-sunken" : "bg-surface") : ""
      } ${className}`}
    >
      <View className="w-9 items-center">
        {podiumColors ? (
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: podiumColors[0] }}
          >
            <Text className="font-bold text-[13px]" style={{ color: podiumColors[1] }}>
              {row.rank}
            </Text>
          </View>
        ) : (
          <Text
            className={`font-semibold text-[14px] ${
              isDark ? "text-text-muted" : "text-tertiary"
            }`}
          >
            {row.rank}
          </Text>
        )}
      </View>

      {row.profile_picture && row.profile_picture !== "default.jpg" ? (
        <Image
          source={{ uri: row.profile_picture }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          className="ml-1"
        />
      ) : (
        <View
          className={`w-9 h-9 rounded-full ml-1 items-center justify-center ${
            isDark ? "bg-surface-raised" : "bg-surface"
          }`}
        >
          <Text
            className={`font-bold text-sm ${
              isDark ? "text-text-primary" : "text-black"
            }`}
          >
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className={`font-bold text-sm ${
            isDark ? "text-text-primary" : "text-black"
          }`}
        >
          {name}
          {isCurrentUser ? " (You)" : ""}
        </Text>
        {row.tier != null && (
          <TierBadge
            tier={row.tier as TierKey}
            stars={row.stars ?? 0}
            size="sm"
            className="mt-0.5"
          />
        )}
      </View>

      {/* Points are what the ranking is *of*, so they get the emphasis and a
          unit — a bare number left the reader to infer what it counted. */}
      <View className="items-end">
        <Text
          className={`font-bold text-[15px] text-text-primary`}
        >
          {row.points.toLocaleString()}
        </Text>
        <Text className={`text-[11px] text-text-muted`}>
          pts
        </Text>
      </View>
    </View>
  );
}
