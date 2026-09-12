import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * How many pixels the software keyboard covers from the bottom of the screen.
 *
 * Ported from the same problem solved in `fieldgrid-mobile`
 * (src/shared/lib/keyboard-modal.ts), because the library's own keyboard
 * handling is not enough on a tall sheet.
 *
 * `@gorhom/bottom-sheet`'s `keyboardBehavior="interactive"` works by moving
 * the sheet up. A sheet already sitting at its largest snap point has nowhere
 * to move to, so the bottom of a long form stays under the keyboard however
 * the sheet behaves. Measuring the overlap lets the *content* make room
 * instead, which works at any snap point.
 *
 * iOS uses the `Will` events so the padding animates with the system rather
 * than snapping in afterwards. Android uses `Did` and has to add the
 * navigation-bar inset itself: under edge-to-edge the IME height alone stops
 * short of the window bottom, so a footer padded by it is still clipped.
 */
export function useKeyboardOverlap(enabled = true): number {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom;
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOverlap(0);
      return;
    }

    if (Platform.OS === "ios") {
      const onFrame = (event: KeyboardEvent) =>
        setOverlap(Math.max(0, Math.round(event.endCoordinates?.height ?? 0)));
      const frame = Keyboard.addListener("keyboardWillChangeFrame", onFrame);
      const hide = Keyboard.addListener("keyboardWillHide", () => setOverlap(0));
      return () => {
        frame.remove();
        hide.remove();
      };
    }

    const onShow = (event: KeyboardEvent) => {
      const ime = Math.max(0, Math.round(event.endCoordinates?.height ?? 0));
      const screenY = event.endCoordinates?.screenY;
      const windowHeight = Dimensions.get("window").height;
      // Two signals that can each be short on their own, so take the larger:
      // the IME height plus the nav-bar inset, or the measured distance from
      // the window bottom to the top of the keyboard.
      const fromScreenY =
        typeof screenY === "number" && Number.isFinite(screenY)
          ? Math.max(0, Math.round(windowHeight - screenY))
          : 0;
      setOverlap(Math.max(ime + Math.max(0, Math.round(safeBottom)), fromScreenY));
    };
    const show = Keyboard.addListener("keyboardDidShow", onShow);
    const hide = Keyboard.addListener("keyboardDidHide", () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, safeBottom]);

  return overlap;
}

/**
 * Bottom padding for a scrollable sheet so its last field clears the keyboard.
 *
 * On iOS the reported keyboard frame includes the home-indicator strip, which
 * the sheet's own safe-area padding already accounts for — counting it twice
 * leaves a visible gap under the keyboard.
 */
export function keyboardScrollPadding(
  overlap: number,
  safeAreaBottom: number,
  restingPadding = 24
): number {
  if (overlap <= 0) return restingPadding;
  const usable =
    Platform.OS === "ios" ? Math.max(0, overlap - safeAreaBottom) : overlap;
  return usable + restingPadding;
}
