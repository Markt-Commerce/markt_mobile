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
  nextStep:
    | "verify_email"
    | "choose_role"
    | "buyer_profile"
    | "seller_profile"
    | null
    | undefined
) {
  switch (nextStep) {
    case "verify_email":
      router.replace("/emailVerification");
      return;
    // An account with neither role. Signing in through Google or Apple
    // makes one: the provider proves the address, and nothing has yet
    // asked whether this person is buying or selling. Anything that
    // interrupted that question -- a closed app, a failed request -- used
    // to leave the account here with nowhere to go, because the server
    // reported no next step at all.
    case "choose_role":
      router.replace("/(onboarding)/yourRole");
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
