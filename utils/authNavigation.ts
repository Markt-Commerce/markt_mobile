import { router } from "expo-router";

/**
 * Auth navigation helpers.
 * Use replace only — dismissAll() dispatches POP_TO_TOP and throws when the stack
 * was already reset by Stack.Protected (e.g. on logout).
 */

/** Land on the main app (post-login / session restore). */
export function navigateToAppHome() {
  router.replace("/(tabs)");
}

/** Land on the guest landing screen (logout / session expired). */
export function navigateToGuestHome() {
  router.replace("/introduction");
}
