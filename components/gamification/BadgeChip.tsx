import React from "react";
import { View, Image } from "react-native";
import { Award } from "lucide-react-native";
import { useTheme } from "../themeProvider";
import type { Badge } from "../../types/gamification";

type Size = "xs" | "sm";

const DIAMETER: Record<Size, number> = { xs: 16, sm: 20 };
const ICON_SIZE: Record<Size, number> = { xs: 9, sm: 11 };

export interface BadgeChipProps {
  badge: Badge;
  size?: Size;
  className?: string;
}

/**
 * Small inline badge icon for tight spaces (feed card headers, seller rows)
 * where BadgeCard's grid-tile size doesn't fit.
 */
export default function BadgeChip({ badge, size = "sm", className = "" }: BadgeChipProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const d = DIAMETER[size];

  return (
    <View
      className={className}
      accessibilityLabel={badge.name}
      style={{
        width: d,
        height: d,
        borderRadius: d / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#2f3132" : "#F4F0EE",
        overflow: "hidden",
      }}
    >
      {badge.icon_url ? (
        <Image source={{ uri: badge.icon_url }} style={{ width: d, height: d }} />
      ) : (
        <Award size={ICON_SIZE[size]} color={isDark ? "#f0f1f2" : "#000000"} />
      )}
    </View>
  );
}
