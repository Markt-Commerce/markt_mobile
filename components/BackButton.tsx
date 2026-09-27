import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { useTokens } from "../theme/useTokens";
import { useBackTo } from "../utils/goBack";

interface BackButtonProps {
  /**
   * Where to go when there is nothing to go back to.
   *
   * Not optional, and not defaulted to the home tab, because the right
   * answer is different on every screen and a silent default is how you get
   * a back arrow that lands somewhere surprising. The screen knows what it
   * sits under; it has to say.
   */
  fallback: string;
  /** Overrides the default behaviour entirely — a sheet that closes itself,
   *  a flow that has its own idea of backwards. */
  onPress?: () => void;
  /** For a button sitting on a photo or a coloured header rather than on the
   *  page background. */
  tint?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/**
 * The back arrow. One of them.
 *
 * There were thirty-nine screens with a hand-rolled one and seventy-seven
 * arrows between them, in two visibly different styles: some a bare arrow,
 * some the same arrow inside a grey rounded square. Which one you got
 * depended on which screen you were standing on, which reads as two
 * different apps.
 *
 * Bare arrow, everywhere. The grey pill was only ever there to make the tap
 * target visible, and a 40pt box with hitSlop does that without drawing a
 * chip nobody asked for.
 *
 * It also cannot dead-end. `router.back()` assumes something pushed this
 * screen, and plenty of paths do not — a push notification opening the app
 * cold, or a flow that `replace`d its way here. In those cases back()
 * dispatches GO_BACK, nothing handles it, and the tap does nothing at all:
 * an arrow that is decoration. `useBackTo` falls through to the screen this
 * one belongs under instead.
 */
export default function BackButton({
  fallback,
  onPress,
  tint,
  accessibilityLabel = "Go back",
  style,
}: BackButtonProps) {
  const t = useTokens();
  const goBack = useBackTo(fallback);

  return (
    <Pressable
      onPress={onPress ?? goBack}
      // The arrow is optically lighter than the box around it, so the box is
      // pulled left to sit flush with the screen's own padding.
      className="w-10 h-10 -ml-2 items-center justify-center"
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <ArrowLeft size={24} color={tint ?? t.textPrimary} strokeWidth={2} />
    </Pressable>
  );
}
