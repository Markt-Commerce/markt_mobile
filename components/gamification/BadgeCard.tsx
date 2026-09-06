import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Lock, Award } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { Badge } from "../../types/gamification";

export interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  progress?: number; // 0..1
  onPress?: () => void;
  className?: string;
}

/** Single badge tile — full-colour when earned, desaturated + progress when locked. */
export default function BadgeCard({
  badge,
  earned,
  progress = 0,
  onPress,
  className = "",
}: BadgeCardProps) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  // One shared clock per tile, on the UI thread. A grid of these costs no JS
  // per frame -- the value is driven natively and only the transform reads it.
  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (earned || reduced) return;
    // Offset per tile so the grid does not pulse in unison, which reads as a
    // loading state rather than a hint. The offset is derived from the badge
    // slug, so it is stable across re-renders instead of jumping on each one.
    const offset =
      (badge.slug ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 2400;

    shimmer.value = withDelay(
      offset,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          // The pause is most of the cycle: a constant sweep would be noise.
          withTiming(1, { duration: 2600 })
        ),
        -1,
        false
      )
    );
  }, [earned, reduced, shimmer, badge.slug]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -30 + shimmer.value * 60 },
      { rotate: "18deg" },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}${earned ? ", earned" : ", locked"}`}
      className={`rounded border p-3 items-center ${
        "bg-surface-raised border-border"
      } ${className}`}
      style={{ opacity: earned ? 1 : 0.55 }}
    >
      <View
        className={`w-14 h-14 rounded-full items-center justify-center mb-2 overflow-hidden ${
          "bg-surface-sunken"
        }`}
      >
        {/* A locked badge shimmers slowly, so the grid reads as full of things
            still to get rather than a wall of greyed-out tiles. Deliberately
            slow and low-contrast: this is a hint, not a notification. It stops
            entirely under reduced motion, and once the badge is earned. */}
        {!earned && !reduced ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                width: 18,
                height: 90,
                backgroundColor: t.textPrimary,
                opacity: 0.07,
              },
              shimmerStyle,
            ]}
          />
        ) : null}
        {badge.icon_url ? (
          <Image
            source={{ uri: badge.icon_url }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : earned ? (
          <Award size={26} color={t.textPrimary} />
        ) : (
          <Lock size={22} color={t.textSecondary} />
        )}
      </View>

      <Text
        numberOfLines={1}
        className={`font-bold text-xs text-center ${
          "text-text-primary"
        }`}
      >
        {badge.name}
      </Text>

      {!earned && progress > 0 && progress < 1 && (
        <View
          className={`h-1 w-full rounded overflow-hidden mt-2 ${
            "bg-surface-sunken"
          }`}
        >
          <View className="h-1 bg-primary rounded" style={{ width: `${pct}%` }} />
        </View>
      )}
    </TouchableOpacity>
  );
}
