import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { View, Text, Image } from "react-native";
import TierBadge from "./TierBadge";
import type { LeaderboardRow as Row, TierKey } from "../../types/gamification";

export interface LeaderboardRowProps {
  row: Row;
  isCurrentUser?: boolean;
  /** Position in the list, for the staggered entrance. */
  index?: number;
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
  index = 0,
  className = "",
}: LeaderboardRowProps) {
  const name = row.username ?? "User";
  const podiumColors = podium(row.rank);
  const reduced = useReducedMotion();

  // Rows settle in sequence rather than appearing all at once, so the board
  // reads as being placed. Capped at 12 so a long list does not turn into a
  // slow reveal the user has to wait out -- everything past the first screenful
  // lands immediately.
  const enter = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = withDelay(
      Math.min(index, 12) * 35,
      withSpring(1, { damping: 18, stiffness: 170, mass: 0.7 })
    );
  }, [index, reduced, enter]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 14 }],
  }));

  return (
    <Animated.View
      style={enterStyle}
      accessibilityLabel={`Rank ${row.rank}, ${name}, ${row.points} points`}
      className={`flex-row items-center px-4 py-3 border-b ${
        "border-border"
      } ${
        isCurrentUser ? ("bg-surface-sunken") : ""
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
              "text-text-muted"
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
            "bg-surface-sunken"
          }`}
        >
          <Text
            className={`font-bold text-sm ${
              "text-text-primary"
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
            "text-text-primary"
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
          className="font-bold text-[15px] text-text-primary"
        >
          {row.points.toLocaleString()}
        </Text>
        <Text className="text-[11px] text-text-muted">
          pts
        </Text>
      </View>
    </Animated.View>
  );
}
