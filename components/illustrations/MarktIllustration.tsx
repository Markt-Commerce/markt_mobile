import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import Svg, { Circle, G, Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
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
 * Entrance timing, in ms. The percentages the shadow syncs to are of CENTER_DUR.
 *
 * Roughly a third slower than the first pass: at 900/1100 the whole thing was
 * over before someone who was already looking at the screen had registered it
 * as motion. This is the same choreography, given time to be seen.
 */
const SIDE_DUR = 1200;
const SIDE_STAGGER = 170;
const CENTER_DELAY = 380;
const CENTER_DUR = 1500;
const at = (pct: number) => Math.round(CENTER_DUR * pct);
/** Landing keyframes: peak, dip, correction, rest. */
const K_PEAK = at(0.55);
const K_DIP = at(0.72);
const K_FIX = at(0.86);
const ENTRANCE_END = CENTER_DELAY + CENTER_DUR;

/**
 * One visible overshoot. A plain ease-in-out arrives and stops dead, which is
 * what made the old version read as a logo lockup rather than an object.
 */
const OVERSHOOT = Easing.bezier(0.34, 1.56, 0.64, 1);

/** How far the idle breath lifts the centre card, and how long one breath takes. */
const BREATHE_SCALE = 1.025;
const BREATHE_DUR = 4000;

/**
 * Landing hero — three stalls that arrive rather than sit there.
 *
 * Layout: the two tinted stalls are shorter and sit either side, bottoms
 * aligned with the filled centre one, which is the only card carrying the
 * person glyph. A soft ellipse under the centre card is its contact shadow.
 *
 * Motion: a staggered entrance, not a synchronised float. The side cards rise
 * first (left, then right 120ms later), each overshooting a few pixels past
 * rest before settling. The centre card starts once they are mostly down,
 * lands harder — a scale that peaks, dips and corrects — and the shadow fades
 * and stretches on that landing, so the bounce reads as weight hitting a
 * surface. Once it has settled the centre card breathes slowly and the side
 * cards stay put: enough life that the screen isn't frozen, not enough to
 * compete with the buttons below it.
 *
 * Each layer is a plain View with its own Svg, so translateY/scale/opacity are
 * ordinary style transforms. The shapes themselves are untouched.
 */

export function MarketHero({ size = 200 }: { size?: number }) {
  const t = useTokens();
  const reduced = useReducedMotion();

  // Bottoms align; the centre card is the tall one. 100:130 is the banner's
  // own aspect ratio, so nothing is stretched.
  const sideW = size * 0.255;
  const centerW = size * 0.33;
  const gap = size * 0.055;
  const centerH = centerW * 1.3;
  const shadowW = centerW * 0.72;
  const shadowH = shadowW * 0.2;
  const shadowGap = size * 0.012;

  // Start state. Under reduce-motion every value is already at rest, so the
  // illustration renders complete and still.
  const leftY = useSharedValue(reduced ? 0 : 40);
  const leftOpacity = useSharedValue(reduced ? 1 : 0);
  const rightY = useSharedValue(reduced ? 0 : 40);
  const rightOpacity = useSharedValue(reduced ? 1 : 0);
  const centerY = useSharedValue(reduced ? 0 : 50);
  const centerScale = useSharedValue(reduced ? 1 : 0.9);
  const centerOpacity = useSharedValue(reduced ? 1 : 0);
  // Idle breathing is kept separate from the entrance scale and multiplied in,
  // so the loop can start without interrupting the landing sequence.
  const breathe = useSharedValue(1);
  const shadowOpacity = useSharedValue(reduced ? 0.1 : 0);
  const shadowScaleX = useSharedValue(reduced ? 1 : 0.6);

  const play = useCallback(() => {
    // The OS setting resolves a tick after mount, so this branch is also what
    // stops an entrance that has already started. Assigning a shared value
    // cancels whatever animation was driving it.
    if (reduced) {
      leftY.value = 0;
      rightY.value = 0;
      centerY.value = 0;
      centerScale.value = 1;
      breathe.value = 1;
      leftOpacity.value = 1;
      rightOpacity.value = 1;
      centerOpacity.value = 1;
      shadowOpacity.value = 0.1;
      shadowScaleX.value = 1;
      return;
    }

    leftY.value = 40;
    rightY.value = 40;
    centerY.value = 50;
    centerScale.value = 0.9;
    breathe.value = 1;
    leftOpacity.value = 0;
    rightOpacity.value = 0;
    centerOpacity.value = 0;
    shadowOpacity.value = 0;
    shadowScaleX.value = 0.6;

    // Side cards: rise, overshoot ~4px past rest, settle. The overshoot is the
    // bezier's own rather than a second keyframe — 0.34/1.56 carries the value
    // ~10% past its target before it comes back.
    const rise = (delay: number) =>
      withDelay(delay, withTiming(0, { duration: SIDE_DUR, easing: OVERSHOOT }));
    const fade = (delay: number) =>
      withDelay(
        delay,
        withTiming(1, { duration: SIDE_DUR * 0.5, easing: Easing.out(Easing.quad) })
      );

    leftY.value = rise(0);
    leftOpacity.value = fade(0);
    rightY.value = rise(SIDE_STAGGER);
    rightOpacity.value = fade(SIDE_STAGGER);

    centerY.value = withDelay(
      CENTER_DELAY,
      withTiming(0, { duration: CENTER_DUR, easing: OVERSHOOT })
    );
    centerOpacity.value = withDelay(
      CENTER_DELAY,
      withTiming(1, { duration: CENTER_DUR * 0.47, easing: Easing.out(Easing.quad) })
    );
    // 0.9 -> 1.04 at 55% -> 0.97 at 72% -> 1.01 at 86% -> 1. The dip is what
    // makes it land rather than glide.
    centerScale.value = withDelay(
      CENTER_DELAY,
      withSequence(
        withTiming(1.04, { duration: K_PEAK, easing: Easing.out(Easing.cubic) }),
        withTiming(0.97, { duration: K_DIP - K_PEAK, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.01, { duration: K_FIX - K_DIP, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: CENTER_DUR - K_FIX, easing: Easing.out(Easing.quad) })
      )
    );

    // The shadow is invisible until the card is on its way down, then spreads
    // on impact and pulls back in. Same clock as the scale keyframes.
    shadowOpacity.value = withDelay(
      CENTER_DELAY + K_PEAK,
      withSequence(
        withTiming(0.15, { duration: K_DIP - K_PEAK, easing: Easing.out(Easing.quad) }),
        withTiming(0.1, { duration: CENTER_DUR - K_DIP, easing: Easing.out(Easing.quad) })
      )
    );
    shadowScaleX.value = withDelay(
      CENTER_DELAY + K_PEAK,
      withSequence(
        withTiming(1.1, { duration: K_DIP - K_PEAK, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: CENTER_DUR - K_DIP, easing: Easing.out(Easing.quad) })
      )
    );

    // Breathing, once everything has landed. Slow enough to be felt rather
    // than watched, and only on the centre card — the side cards staying put
    // is what keeps the eye on the one with a person in it.
    breathe.value = withDelay(
      ENTRANCE_END,
      withRepeat(
        withTiming(BREATHE_SCALE, {
          duration: BREATHE_DUR,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      )
    );
  }, [
    reduced,
    leftY,
    leftOpacity,
    rightY,
    rightOpacity,
    centerY,
    centerScale,
    centerOpacity,
    breathe,
    shadowOpacity,
    shadowScaleX,
  ]);

  // On focus rather than on mount, so coming back from sign-in or the
  // catalogue replays it instead of showing an already-finished picture.
  useFocusEffect(
    useCallback(() => {
      play();
      return () => {
        // Nothing should be animating behind another screen.
        cancelAnimation(breathe);
      };
    }, [play, breathe])
  );

  const leftStyle = useAnimatedStyle(() => ({
    opacity: leftOpacity.value,
    transform: [{ translateY: leftY.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: rightOpacity.value,
    transform: [{ translateY: rightY.value }],
  }));
  const centerStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
    transform: [
      { translateY: centerY.value },
      { scale: centerScale.value * breathe.value },
    ],
  }));
  // The shadow answers the breath: as the card lifts, its contact shadow
  // tightens and lightens. That is what sells the idle as breathing rather
  // than as a card quietly pulsing for no reason.
  const shadowStyle = useAnimatedStyle(() => {
    const lift = (breathe.value - 1) / (BREATHE_SCALE - 1);
    return {
      opacity: shadowOpacity.value * (1 - lift * 0.3),
      transform: [{ scaleX: shadowScaleX.value * (1 - lift * 0.07) }],
    };
  });

  return (
    <View
      style={{ width: size, height: size * 0.9, justifyContent: "center" }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Three market stalls"
    >
      <View style={{ height: centerH + shadowGap + shadowH }}>
        {/* Drawn first so it sits under the card it belongs to. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              bottom: 0,
              alignSelf: "center",
              width: shadowW,
              height: shadowH,
              borderRadius: shadowH / 2,
              backgroundColor: t.textMuted,
            },
            shadowStyle,
          ]}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap,
            height: centerH,
          }}
        >
          {/* Back stalls are tinted, not opaque: depth without a second hue. */}
          <Animated.View style={[{ width: sideW, height: sideW * 1.3 }, leftStyle]}>
            <Svg width="100%" height="100%" viewBox={VIEWBOX}>
              <Banner fill={t.primaryMuted} personFill={t.surfacePage} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ width: centerW, height: centerH }, centerStyle]}>
            <Svg width="100%" height="100%" viewBox={VIEWBOX}>
              <Banner fill={t.primaryFill} withPerson personFill={t.textOnPrimary} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ width: sideW, height: sideW * 1.3 }, rightStyle]}>
            <Svg width="100%" height="100%" viewBox={VIEWBOX}>
              <Banner fill={t.primaryMuted} personFill={t.surfacePage} />
            </Svg>
          </Animated.View>
        </View>
      </View>
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
