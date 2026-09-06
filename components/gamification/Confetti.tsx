import React, { useMemo } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

/**
 * A particle burst, built from Reanimated transforms.
 *
 * The existing celebration modals carried a comment saying a Lottie confetti
 * asset would be "supplied by design". It never was, and adding
 * lottie-react-native for a file that does not exist would mean inventing the
 * asset too. A burst is a few dozen pieces on ballistic paths — Reanimated is
 * already here, already on the UI thread, and costs no new bytes.
 *
 * Every piece animates from one shared clock started on mount. There is no
 * per-frame JS: each piece derives its position from its own timing value, so
 * the whole burst runs on the UI thread and the JS thread stays free for the
 * screen underneath.
 */

function Piece({
  index,
  total,
  colors,
  spread,
}: {
  index: number;
  total: number;
  colors: string[];
  spread: number;
}) {
  const progress = useSharedValue(0);

  // Fixed per piece, so the burst is varied but stable across re-renders.
  const seed = useMemo(() => {
    const angle = (index / total) * Math.PI * 2 + (index % 3) * 0.35;
    return {
      dx: Math.cos(angle) * spread * (0.55 + ((index * 37) % 45) / 100),
      dy: -Math.abs(Math.sin(angle)) * spread * (0.7 + ((index * 17) % 40) / 100),
      size: 6 + ((index * 13) % 6),
      rotate: ((index * 53) % 360) - 180,
      color: colors[index % colors.length],
      delay: (index % 6) * 28,
    };
  }, [index, total, colors, spread]);

  React.useEffect(() => {
    progress.value = withDelay(
      seed.delay,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })
    );
  }, [progress, seed.delay]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Ballistic: outward at a constant rate, gravity pulling down over time.
    const x = seed.dx * p;
    const y = seed.dy * p + 220 * p * p;
    return {
      opacity: p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${seed.rotate * p}deg` },
        { scale: 1 - p * 0.25 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: seed.size,
          height: seed.size * 1.6,
          borderRadius: 1.5,
          backgroundColor: seed.color,
        },
        style,
      ]}
    />
  );
}

export default function Confetti({
  count = 28,
  colors,
  spread = 170,
}: {
  count?: number;
  /** Required, and always theme tokens. A default palette here would be a set
   *  of hard-coded hexes that neither theme agreed with. */
  colors: string[];
  spread?: number;
}) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
      // Decorative: it carries no information the copy does not already give.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pieces.map((i) => (
        <Piece key={i} index={i} total={count} colors={colors} spread={spread} />
      ))}
    </View>
  );
}
