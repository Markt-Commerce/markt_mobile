import React, { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import * as haptics from "../../utils/haptics";

/**
 * A number that counts to its new value instead of swapping to it.
 *
 * Points are the most frequent reward in the app and the least felt: the total
 * simply changed between renders, so a user who earned something saw a
 * different number rather than watching it earned.
 *
 * Driven by an interval on the JS thread rather than Reanimated, deliberately.
 * Reanimated animates *style*, and this animates the string inside a <Text>;
 * driving that from a worklet means a per-frame bridge hop to setState, which
 * is worse than the ~12 timer ticks used here. Motion in this file is a
 * changing label, not a moving view.
 */
export default function CountUp({
  value,
  duration = 700,
  hapticOnChange = false,
  ...textProps
}: {
  value: number;
  duration?: number;
  /** A light tick when the number climbs. Off by default. */
  hapticOnChange?: boolean;
} & TextProps) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  const reduced = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (from === value) return;

    // Reduced motion, or a first paint: land on the number.
    if (reduced) {
      setShown(value);
      return;
    }

    if (hapticOnChange && value > from) haptics.tick();

    const steps = 12;
    const stepMs = Math.max(16, Math.round(duration / steps));
    let i = 0;

    const id = setInterval(() => {
      i += 1;
      // Ease out: fast at first, settling into the final value.
      const p = 1 - Math.pow(1 - i / steps, 3);
      setShown(Math.round(from + (value - from) * p));
      if (i >= steps) {
        setShown(value);
        clearInterval(id);
      }
    }, stepMs);

    return () => clearInterval(id);
  }, [value, duration, reduced, hapticOnChange]);

  return (
    <Text {...textProps} accessibilityLabel={String(value)}>
      {shown.toLocaleString()}
    </Text>
  );
}
