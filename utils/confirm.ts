import { Alert } from "react-native";

/**
 * Ask before doing something the person cannot undo.
 *
 * These were written one at a time, so most were not written at all: deleting
 * a product, deleting your own review, blocking someone and emptying a shop's
 * basket all happened on the first tap. The ones that did ask each phrased it
 * differently.
 *
 * The wording rules are the point of having this in one place:
 *
 *  - the title asks a question, so the destructive answer is never the one
 *    your thumb is already on
 *  - the message says what is actually lost, or that nothing is
 *  - the cancel button says what keeping it means ("Keep it"), not "Cancel",
 *    which reads as cancelling the *order* on an order screen
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
}: {
  /** A question: "Delete this product?" */
  title: string;
  /** What is lost, or what is not. */
  message?: string;
  /** The verb, not "OK": "Delete", "Block", "Empty". */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}): void {
  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: "destructive",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
