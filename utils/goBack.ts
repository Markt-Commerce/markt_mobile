import { useCallback } from "react";
import { useRouter } from "expo-router";

/**
 * Back, or somewhere sensible when there is no back.
 *
 * `router.back()` assumes a screen was pushed onto something. Two paths reach
 * a screen with an empty stack:
 *
 *  - after paying, where the checkout screens are dismissed and the order is
 *    *replaced* onto the root, so Back is not asked to return to "Choose
 *    payment method" for an order already paid
 *  - a push notification opening the app cold, straight onto the thing it is
 *    about
 *
 * In both, `back()` dispatches GO_BACK, no navigator handles it, and the tap
 * does nothing at all — the buyer is stranded on a screen with a back arrow
 * that is decorative.
 *
 * So: go back when there is something to go back to, and otherwise go to the
 * screen this one belongs under. `replace`, not `push`, so the fallback does
 * not build a history that leads back to the same dead end.
 */
export function useBackTo(fallbackHref: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref as never);
  }, [router, fallbackHref]);
}
