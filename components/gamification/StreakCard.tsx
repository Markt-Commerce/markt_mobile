import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Flame } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { StreakInfo } from "../../types/gamification";

/**
 * The consecutive-day streak.
 *
 * The flame breathes while the streak is alive and sits still once it has
 * lapsed, which is the whole message in one glance: this is a thing you keep
 * going, and it is currently going. Scale rather than colour does the work, so
 * it survives being read quickly.
 *
 * Nothing here invents encouragement. A lapsed streak says what it is; a
 * first-day streak is a first day. Overstating either is how gamification
 * starts feeling like it is managing you.
 */
export default function StreakCard({
  streak,
  className = "",
}: {
  streak: StreakInfo;
  className?: string;
}) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const alive = streak.days > 0 && streak.active_today;

  const pulse = useSharedValue(1);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!alive || reduced) {
      pulse.value = 1;
      return;
    }
    // Slow, small, and never-ending: a heartbeat, not an attention-grab.
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [alive, reduced, pulse]);

  // A spring on the count when the streak advances.
  useEffect(() => {
    if (reduced) return;
    pop.value = 0;
    pop.value = withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 });
  }, [streak.days, reduced, pop]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const countStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + pop.value * 0.1 }],
  }));

  const label =
    streak.days === 0
      ? "Start a streak by opening Markt tomorrow"
      : alive
        ? `Longest: ${streak.longest} day${streak.longest === 1 ? "" : "s"}`
        : "Open Markt today to keep it alive";

  return (
    <View
      className={`flex-row items-center gap-3 rounded border border-border bg-surface-raised px-4 py-3 ${className}`}
      accessible
      accessibilityLabel={`${streak.days} day streak. ${label}`}
    >
      <Animated.View style={flameStyle}>
        <Flame
          size={26}
          color={alive ? t.warning : t.textMuted}
          fill={alive ? t.warning : "transparent"}
          strokeWidth={1.8}
        />
      </Animated.View>

      <View className="flex-1">
        <View className="flex-row items-baseline gap-1.5">
          <Animated.Text
            style={countStyle}
            className="text-[20px] font-bold text-text-primary"
          >
            {streak.days}
          </Animated.Text>
          <Text className="text-sm font-semibold text-text-secondary">
            day{streak.days === 1 ? "" : "s"} in a row
          </Text>
        </View>
        <Text className="text-xs text-text-muted mt-0.5">{label}</Text>
      </View>
    </View>
  );
}
