import React from "react";
import { View } from "react-native";
import { useTokens } from "../../theme/useTokens";

/**
 * Where you are, and how much is left.
 *
 * The old flow ran six screens with no indicator at all, so there was no way to
 * tell whether you were one screen from done or four. Dots rather than a bar
 * because the count is small and discrete — a percentage would imply more
 * precision than "two steps" has.
 */
export default function StepDots({
  total,
  current,
  className = "",
}: {
  total: number;
  /** 1-based. */
  current: number;
  className?: string;
}) {
  const t = useTokens();
  return (
    <View
      className={`flex-row items-center gap-1.5 ${className}`}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i + 1 <= current;
        return (
          <View
            key={i}
            style={{
              width: i + 1 === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: done ? t.primaryFill : t.border,
            }}
          />
        );
      })}
    </View>
  );
}
