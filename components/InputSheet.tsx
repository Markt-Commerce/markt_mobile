import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTokens } from "../theme/useTokens";
import {
  useKeyboardOverlap,
  keyboardScrollPadding,
} from "../hooks/useKeyboardOverlap";
import { dismissKeyboard } from "../utils/keyboard";

export interface InputSheetHandle {
  expand: () => void;
  close: () => void;
}

/**
 * A form sheet whose action bar sits on the keyboard.
 *
 * Replaces @gorhom/bottom-sheet for forms, after three attempts to make that
 * library behave here:
 *
 *   1. `keyboardBehavior="interactive"` moves the sheet up — useless at the
 *      90% snap point, where there is nowhere left to move.
 *   2. Measured scroll padding let the last field be *scrolled* clear, but
 *      the submit button was still the last thing in a long form.
 *   3. `BottomSheetFooter` docks, but positions against the sheet rather than
 *      the keyboard, so it ended up behind it.
 *
 * The structure here is the one fieldgrid-mobile settled on
 * (src/shared/ui/fieldgrid-keyboard-bottom-sheet.tsx): a Modal, a scrim, and
 * a `KeyboardAvoidingView` that lifts the whole sheet. The footer is a
 * sibling of the scroll view rather than an overlay on it, so "above the
 * keyboard" is a layout fact rather than a calculation.
 *
 * A Modal also fixes the other half of the complaint. A gorhom sheet renders
 * inside the screen, so the floating action button and the tab bar stayed on
 * top of it; a Modal is its own window, and the scrim dims what is behind.
 */
const InputSheet = forwardRef<InputSheetHandle, {
  title: string;
  children: ReactNode;
  /** The action bar's contents. Rendered pinned, never scrolled. */
  footer: ReactNode;
  /** Blocks dismissal while something is in flight. */
  busy?: boolean;
  onClose?: () => void;
  /** Covers the sheet while busy — see SheetBusyOverlay. */
  overlay?: ReactNode;
  maxHeight?: `${number}%`;
}>(function InputSheet(
  { title, children, footer, busy = false, onClose, overlay, maxHeight = "88%" },
  ref
) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const keyboardOverlap = useKeyboardOverlap(visible);

  useImperativeHandle(
    ref,
    () => ({
      expand: () => setVisible(true),
      close: () => {
        dismissKeyboard();
        setVisible(false);
      },
    }),
    []
  );

  const dismiss = useCallback(() => {
    if (busy) return;
    dismissKeyboard();
    setVisible(false);
    onClose?.();
  }, [busy, onClose]);

  /**
   * iOS lifts the whole sheet with the keyboard, so it only needs its resting
   * safe-area padding. Android does not, so the padding has to hold the
   * footer clear itself.
   */
  const sheetBottomPad =
    Platform.OS === "ios"
      ? Math.max(insets.bottom, 12)
      : keyboardScrollPadding(keyboardOverlap, insets.bottom, 12);

  // The keyboard's own background does not extend under a lifted sheet, which
  // leaves a hairline of wallpaper between the two. A block of sheet colour
  // behind that gap hides the seam.
  const iosSeam =
    Platform.OS === "ios" && keyboardOverlap > 0
      ? Math.max(0, keyboardOverlap - insets.bottom) + insets.bottom
      : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }]}
          onPress={dismiss}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
        />

        {iosSeam > 0 ? (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 bottom-0 bg-surface-page"
            style={{ height: iosSeam }}
          />
        ) : null}

        <View className="flex-1 justify-end" pointerEvents="box-none">
          <View
            className="rounded-t-3xl border-t border-border bg-surface-page overflow-hidden"
            style={{ paddingBottom: sheetBottomPad, maxHeight }}
            accessibilityViewIsModal
          >
            <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
              <Text className="flex-1 text-[17px] font-bold text-text-primary">
                {title}
              </Text>
              <Pressable
                onPress={dismiss}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-sunken"
              >
                <X size={20} color={t.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              // flexShrink, not flex-1: the sheet should be as tall as its
              // content up to maxHeight, not always as tall as it is allowed.
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View className="flex-row items-center gap-3 px-4 pt-2.5 border-t border-border">
              {footer}
            </View>

            {overlay}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default InputSheet;
