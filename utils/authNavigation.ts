import { router } from "expo-router";

/** Reset stack and land on the main app (post-login / session restore). */
export function navigateToAppHome() {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace("/(tabs)");
}

/** Reset stack and land on the guest landing screen (logout / session expired). */
export function navigateToGuestHome() {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace("/introduction");
}
