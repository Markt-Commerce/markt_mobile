import React from "react";
import { View, Text } from "react-native";
import { Star } from "lucide-react-native";
import { useTheme } from "../themeProvider";
import type { TierKey } from "../../types/gamification";

type Size = "sm" | "md" | "lg";

const STAR_SIZE: Record<Size, number> = { sm: 12, md: 16, lg: 22 };
const TEXT_SIZE: Record<Size, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export interface TierBadgeProps {
  tier: TierKey;
  stars: number;
  /** Display name (falls back to a capitalised tier key). */
  name?: string;
  /** Tier colour from the API — never hard-coded client-side. */
  colorHex?: string;
  size?: Size;
  showName?: boolean;
  className?: string;
}

/**
 * Star icon + optional tier-name pill. Shown next to a user's name across the
 * app (profile header, leaderboard rows, etc.). Colours come from the API.
 */
export default function TierBadge({
  tier,
  stars,
  name,
  colorHex,
  size = "md",
  showName = false,
  className = "",
}: TierBadgeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const color = colorHex || "#F5A623";
  const s = STAR_SIZE[size];
  const displayName = name ?? tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View
      className={`flex-row items-center ${className}`}
      accessibilityLabel={`${displayName} tier, ${stars} stars`}
    >
      {stars > 0 ? (
        <View className="flex-row items-center">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={s} color={color} fill={color} />
          ))}
        </View>
      ) : (
        <Star size={s} color={isDark ? "#c6c5cf" : "#A1A1AA"} />
      )}

      {showName && (
        <View
          className="ml-2 px-2 py-0.5 rounded"
          style={{ backgroundColor: `${color}22`, borderColor: color, borderWidth: 1 }}
        >
          <Text className={`font-geist font-bold ${TEXT_SIZE[size]}`} style={{ color }}>
            {displayName}
          </Text>
        </View>
      )}
    </View>
  );
}
