import { Keyboard, TextInput } from "react-native";

/**
 * Collapse the keyboard and release whatever holds focus.
 *
 * `Keyboard.dismiss()` alone leaves the focused TextInput focused inside a
 * Modal, so the keyboard reappears the moment anything re-renders. Blurring
 * the node first is what actually lets go.
 */
export function dismissKeyboard() {
  const state = (TextInput as unknown as {
    State?: {
      currentlyFocusedInput: () => unknown;
      blurTextInput: (node: unknown) => void;
    };
  }).State;
  const focused = state?.currentlyFocusedInput?.();
  if (focused != null) state?.blurTextInput?.(focused);
  Keyboard.dismiss();
}
