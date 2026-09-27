import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * The app's haptic vocabulary, in one place.
 *
 * Wrapped rather than called directly so the intent is named at the call site
 * ("celebrate", "tick") instead of a library enum, and so the whole app can be
 * silenced from one spot. Every call is fire-and-forget: a device without a
 * taptic engine rejects the promise, and a failed buzz must never surface as
 * an error during a celebration.
 */

let enabled = true;

/** Off switch, for a future settings toggle. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

function safe(run: () => Promise<void>) {
  if (!enabled) return;
  // Web has no haptics API at all; calling through would throw.
  if (Platform.OS === "web") return;
  run().catch(() => {});
}

/** A badge unlocked, a tier reached — the big moments. */
export function celebrate() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Points landed, a streak ticked over — small, frequent feedback. */
export function tick() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A rank moved, something arrived — mid-weight. */
export function bump() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
