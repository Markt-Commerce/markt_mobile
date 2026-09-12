import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTokens } from "../theme/useTokens";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Covers a bottom sheet while it is doing something the user must wait for.
 *
 * The thing it replaces was a grey strip at the top of the form reading
 * "Uploading images… please keep this sheet open." Two problems with that:
 * the sheet stayed fully interactive-looking underneath, so "keep this open"
 * had to be said in words instead of shown; and on a scrolled form the strip
 * was often off-screen, so the one instruction that mattered was invisible
 * exactly when it applied.
 *
 * A scrim rather than a blur. `expo-blur` is a native module, and adding one
 * means a new dev build — which is the thing that broke Expo Go for this
 * project once already. A translucent surface over a form of soft grey fields
 * reads almost identically, and costs nothing.
 */
export default function SheetBusyOverlay({
  visible,
  title,
  subtitle,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
}) {
  const t = useTokens();
  const reduced = useReducedMotion();

  if (!visible) return null;

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(160)}
      exiting={reduced ? undefined : FadeOut.duration(120)}
      // Covers the sheet, not the screen: the handle stays visible so the
      // sheet still reads as a sheet, and the tab bar underneath is untouched.
      className="absolute inset-0 z-50 items-center justify-center px-10"
      style={{ backgroundColor: t.scrim }}
      accessibilityViewIsModal
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityLiveRegion="polite"
      // Swallows taps, which is the actual enforcement of "keep this open" —
      // previously that was a sentence and a `pointerEvents` prop on one
      // subtree.
      pointerEvents="auto"
    >
      <View className="items-center gap-4 rounded-2xl px-8 py-7 bg-surface-raised">
        <ActivityIndicator size="large" color={t.primaryFill} />
        <View className="items-center gap-1">
          <Text className="text-[15px] font-bold text-center text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] leading-5 text-center text-text-secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
