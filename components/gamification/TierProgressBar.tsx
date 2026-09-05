import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../themeProvider";

export interface TierProgressBarProps {
  progress: number; // 0..1
  pointsToNext: number;
  nextTierName?: string | null;
  colorHex?: string;
  className?: string;
}

/** Progress-to-next-tier bar with a "N pts to X" caption. */
export default function TierProgressBar({
  progress,
  pointsToNext,
  nextTierName,
  colorHex,
  className = "",
}: TierProgressBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  const color = colorHex || "#E94C2A";
  const atMax = pointsToNext <= 0;

  return (
    <View className={className}>
      <View
        className={`h-2 rounded overflow-hidden bg-surface-sunken`}
      >
        <View
          className="h-2 rounded"
          style={{ width: `${atMax ? 100 : pct}%`, backgroundColor: color }}
        />
      </View>
      <Text
        className={`text-xs mt-2 text-text-secondary`}
      >
        {atMax
          ? "Top tier reached"
          : `${pointsToNext.toLocaleString()} pts to ${nextTierName ?? "next tier"}`}
      </Text>
    </View>
  );
}
