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

/**
 * Land wherever this account actually is.
 *
 * Signup can now be interrupted at any point after the first screen, because
 * the account exists from that screen onwards. Someone who registered,
 * verified, and then closed the app still has no display name — dropping them
 * into the tabs would leave a half-built account with no route back to the
 * form. The server answers this (see app/users/onboarding.py); the client
 * only routes on it.
 */
export function navigateToOnboardingStep(
  nextStep: "verify_email" | "buyer_profile" | "seller_profile" | null | undefined
) {
  switch (nextStep) {
    case "verify_email":
      router.replace("/emailVerification");
      return;
    case "buyer_profile":
      router.replace("/userdetBuyer");
      return;
    case "seller_profile":
      router.replace("/userdetSeller");
      return;
    default:
      navigateToAppHome();
  }
}
