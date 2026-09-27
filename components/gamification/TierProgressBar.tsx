import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTokens } from "../../theme/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface TierProgressBarProps {
  progress: number; // 0..1
  pointsToNext: number;
  nextTierName?: string | null;
  colorHex?: string;
  className?: string;
}

/**
 * Progress-to-next-tier bar with a "N pts to X" caption.
 *
 * The fill animates on gain rather than jumping. It is the one place in the
 * app where a user can watch themselves get closer to something, and a hard
 * width change threw that away — the bar was simply longer next time you
 * looked at it.
 *
 * Spring rather than timing: the bar is showing progress toward a goal, and a
 * slight overshoot as it lands reads as momentum. Width is animated on the UI
 * thread through Reanimated, so a long list of these costs no JS per frame.
 */
export default function TierProgressBar({
  progress,
  pointsToNext,
  nextTierName,
  colorHex,
  className = "",
}: TierProgressBarProps) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const atMax = pointsToNext <= 0;
  const target = atMax ? 1 : Math.max(0, Math.min(1, progress));
  const color = colorHex || t.primaryText;

  const fill = useSharedValue(target);

  useEffect(() => {
    fill.value = reduced
      ? withTiming(target, { duration: 120 })
      : withSpring(target, { damping: 16, stiffness: 120, mass: 0.7 });
  }, [target, reduced, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View className={className}>
      <View
        className="h-2 rounded overflow-hidden bg-surface-sunken"
        // The bar is the visual; the caption below carries the same fact in
        // words, so the bar itself does not need announcing twice.
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      >
        <Animated.View
          className="h-2 rounded"
          style={[{ backgroundColor: color }, fillStyle]}
        />
      </View>
      <Text className="text-xs mt-2 text-text-secondary">
        {atMax
          ? "Top tier reached"
          : `${pointsToNext.toLocaleString()} pts to ${nextTierName ?? "next tier"}`}
      </Text>
    </View>
  );
}
