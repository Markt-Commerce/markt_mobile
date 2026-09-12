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

/**
 * A shop card placeholder.
 *
 * The shop list was using ProductSkeletonRow -- two 150px tiles side by side,
 * because that is what a product grid looks like. A shop card is nothing like
 * it: full width, a 104px banner, an avatar overlapping the banner's bottom
 * edge, then a name, two lines of description and a row of stats. The
 * placeholder promised one layout and the content arrived as another, which
 * is worse than a spinner -- a spinner at least promises nothing.
 *
 * Same measurements as ShopCard, so the swap is invisible.
 */
export function ShopSkeletonCard() {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-border bg-surface-raised">
      <SkeletonBlock width="100%" height={104} radius={0} />
      <View className="px-4 pb-4">
        {/* The avatar sits over the banner, as it does on the real card. */}
        <View className="-mt-8 mb-2 flex-row items-end justify-between">
          <View className="rounded-full border-4 border-surface-raised">
            <SkeletonBlock width={56} height={56} radius={28} />
          </View>
          <View className="mb-1">
            <SkeletonBlock width={72} height={26} radius={13} />
          </View>
        </View>
        <SkeletonBlock width="55%" height={16} radius={6} />
        <View className="mt-2">
          <SkeletonBlock width="90%" height={13} radius={6} />
        </View>
        <View className="mt-1.5">
          <SkeletonBlock width="70%" height={13} radius={6} />
        </View>
        <View className="mt-2.5 flex-row items-center gap-4">
          <SkeletonBlock width={64} height={13} radius={6} />
          <SkeletonBlock width={80} height={13} radius={6} />
        </View>
      </View>
    </View>
  );
}
