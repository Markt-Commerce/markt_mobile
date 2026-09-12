import React, { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTokens } from "../theme/useTokens";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * A loading placeholder.
 *
 * A pulse rather than a sweeping shimmer: one shared value per block, animated
 * on the UI thread, so a screenful costs no per-frame JS. Under reduced motion
 * it sits still at a visible opacity — the layout still communicates "content
 * is coming", which is the actual job.
 */
export default function SkeletonBlock({
  width,
  height,
  radius = 12,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(reduced ? 0.6 : 0.45);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [reduced, pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: t.skeleton },
        animated,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** A product tile placeholder, matching the real card's proportions. */
export function ProductSkeletonRow() {
  return (
    <View className="flex-row gap-3 px-4 pt-4">
      {[0, 1].map((i) => (
        <View key={i} className="flex-1">
          <SkeletonBlock width="100%" height={150} radius={16} />
          <View className="mt-2">
            <SkeletonBlock width="80%" height={13} radius={6} />
          </View>
          <View className="mt-1.5">
            <SkeletonBlock width="45%" height={13} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}
