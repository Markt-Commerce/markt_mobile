import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTokens } from "../../theme/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  BANNER,
  HEAD_CX,
  HEAD_CY,
  HEAD_R,
  PIN,
  PIN_HOLE_CY,
  PIN_HOLE_R,
  SHOULDERS,
  TICK,
  VIEWBOX,
} from "./MarktShapes";

/**
 * Illustrations built from the Markt mark itself.
 *
 * Drawn in code rather than shipped as assets: no Lottie, no asset pipeline,
 * nothing invented from a stock library. Each one composes the banner, person,
 * tick and pin defined in MarktShapes, and takes its colour from the theme, so
 * they are correct in both light and dark without a second set of files.
 *
 * Motion is Reanimated on the UI thread and respects reduce-motion — every
 * variant renders a still, complete image when motion is off.
 */

const AnimatedG = Animated.createAnimatedComponent(G);

/** One stall banner, optionally holding the person glyph. */
function Banner({
  fill,
  withPerson,
  personFill,
}: {
  fill: string;
  withPerson?: boolean;
  personFill: string;
}) {
  return (
    <G>
      <Path d={BANNER} fill={fill} />
      {withPerson ? (
        <G>
          <Circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={personFill} />
          <Path d={SHOULDERS} fill={personFill} />
        </G>
      ) : null}
    </G>
  );
}

/**
 * Landing hero — three stalls at different heights, breathing gently out of
 * phase so the group reads as a market rather than a logo lockup.
 */
export function MarketHero({ size = 200 }: { size?: number }) {
  const t = useTokens();
  const reduced = useReducedMotion();

  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const float = (v: typeof a, delay: number) => {
      v.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
    };
    // Out of phase on purpose: in sync they read as one object sliding.
    float(a, 0);
    float(b, 600);
    float(c, 1200);
  }, [reduced, a, b, c]);

  // Animated as an SVG `transform` string rather than a style: <G> positions
  // itself in user space, and a RN style transform does not apply to it.
  // Written out three times instead of through a helper because each is a hook
  // call and hooks cannot be produced by a loop or a helper function.
  const g1 = useAnimatedProps(() => ({
    transform: `translate(0, ${40 - a.value * 6}) scale(0.62)`,
  }));
  const g3 = useAnimatedProps(() => ({
    transform: `translate(196, ${44 - c.value * 5}) scale(0.58)`,
  }));
  const g2 = useAnimatedProps(() => ({
    transform: `translate(92, ${10 - b.value * 9}) scale(0.86)`,
  }));

  return (
    <View
      style={{ width: size, height: size * 0.9 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Three market stalls"
    >
      <Svg width="100%" height="100%" viewBox="0 0 300 180">
        {/* Back stalls are tinted, not opaque: depth without a second hue. */}
        <AnimatedG animatedProps={g1}>
          <Banner fill={t.primaryMuted} personFill={t.surfacePage} />
        </AnimatedG>
        <AnimatedG animatedProps={g3}>
          <Banner fill={t.primaryMuted} personFill={t.surfacePage} />
        </AnimatedG>
        <AnimatedG animatedProps={g2}>
          <Banner fill={t.primaryFill} withPerson personFill={t.textOnPrimary} />
        </AnimatedG>
      </Svg>
    </View>
  );
}

/**
 * Empty state — one banner with nobody in it. The absence *is* the message,
 * so it needs no crossed-out icon or shrug.
 */
export function EmptyStall({
  size = 120,
  label = "Nothing here yet",
}: {
  size?: number;
  label?: string;
}) {
  const t = useTokens();
  return (
    <View
      style={{ width: size, height: size * 1.3 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        <Path d={BANNER} fill="none" stroke={t.border} strokeWidth={5} />
        <Circle
          cx={HEAD_CX}
          cy={HEAD_CY}
          r={HEAD_R}
          fill="none"
          stroke={t.border}
          strokeWidth={5}
          strokeDasharray="6 7"
        />
      </Svg>
    </View>
  );
}

/**
 * Success — the tick from the wordmark's "a", drawn into a filled banner.
 * The logo already contains a tick, so the app's "done" mark is the brand's.
 */
export function SuccessMark({ size = 120 }: { size?: number }) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      pop.value = 1;
      return;
    }
    pop.value = withSpring(1, { damping: 11, stiffness: 190, mass: 0.6 });
  }, [reduced, pop]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.7 + pop.value * 0.3 }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size * 1.3 }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Done"
    >
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        <Path d={BANNER} fill={t.primaryFill} />
        <Path
          d={TICK}
          fill="none"
          stroke={t.textOnPrimary}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Location empty state — the pin, built from the banner's own notch inverted
 * to a point so the map screens stay in the family.
 */
export function LocationMark({ size = 110 }: { size?: number }) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const drop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      drop.value = 1;
      return;
    }
    drop.value = withSpring(1, { damping: 9, stiffness: 160, mass: 0.8 });
  }, [reduced, drop]);

  const style = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (1 - drop.value) * -22 }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size * 1.2 }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Location"
    >
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        <Path d={PIN} fill={t.primaryFill} />
        <Circle cx={HEAD_CX} cy={PIN_HOLE_CY} r={PIN_HOLE_R} fill={t.surfacePage} />
      </Svg>
    </Animated.View>
  );
}
