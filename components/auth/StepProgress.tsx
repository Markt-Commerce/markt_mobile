import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTokens } from "../../theme/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Where you are in a multi-step flow, with the step named.
 *
 * The old indicator was three bare segments — it showed *how far* but never
 * *what for*, so the user could see two steps remained without knowing whether
 * that meant two fields or two forms. Naming the step is most of the value.
 *
 * The fill springs rather than jumping, which is the one bit of motion that
 * genuinely aids orientation: you see the bar travel, so you feel the progress
 * rather than noticing a different picture on the next screen.
 */
export default function StepProgress({
  step,
  total,
  label,
  className = "",
}: {
  /** 1-based. */
  step: number;
  total: number;
  /** What this step is asking for. */
  label?: string;
  className?: string;
}) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, step / total));
  const fill = useSharedValue(target);

  useEffect(() => {
    fill.value = reduced
      ? withTiming(target, { duration: 120 })
      : withSpring(target, { damping: 17, stiffness: 130, mass: 0.7 });
  }, [target, reduced, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View
      className={className}
      accessibilityRole="progressbar"
      accessibilityLabel={
        label ? `Step ${step} of ${total}: ${label}` : `Step ${step} of ${total}`
      }
      accessibilityValue={{ min: 1, max: total, now: step }}
    >
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-[13px] font-semibold text-text-primary">
          {label ?? `Step ${step}`}
        </Text>
        <Text className="text-[12px] text-text-muted">
          {step} of {total}
        </Text>
      </View>

      <View className="h-1.5 rounded-full overflow-hidden bg-surface-sunken">
        <Animated.View
          className="h-1.5 rounded-full"
          style={[{ backgroundColor: t.primaryFill }, fillStyle]}
        />
      </View>
    </View>
  );
}
