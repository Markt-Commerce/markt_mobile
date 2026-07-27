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

function medal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
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
  const medalIcon = medal(row.rank);

  return (
    <View
      accessibilityLabel={`Rank ${row.rank}, ${name}, ${row.points} points`}
      className={`flex-row items-center px-4 py-3 border-b ${
        isDark ? "border-[#46464e]" : "border-border"
      } ${
        isCurrentUser ? (isDark ? "bg-[#2f3132]" : "bg-surface") : ""
      } ${className}`}
    >
      <View className="w-8 items-center">
        {medalIcon ? (
          <Text className="text-lg">{medalIcon}</Text>
        ) : (
          <Text
            className={`font-geist font-bold text-sm ${
              isDark ? "text-[#c6c5cf]" : "text-tertiary"
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
            isDark ? "bg-[#1a1c1d]" : "bg-surface"
          }`}
        >
          <Text
            className={`font-geist font-bold text-sm ${
              isDark ? "text-[#f0f1f2]" : "text-black"
            }`}
          >
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className={`font-geist font-bold text-sm ${
            isDark ? "text-[#f0f1f2]" : "text-black"
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

      <Text
        className={`font-geist font-bold text-sm ${
          isDark ? "text-[#f0f1f2]" : "text-black"
        }`}
      >
        {row.points.toLocaleString()}
      </Text>
    </View>
  );
}
