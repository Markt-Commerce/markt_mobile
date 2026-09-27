/**
 * A one-line pub/sub so a service can tell the Orders tab badge that whatever
 * it counts has changed.
 *
 * The alternative was calling a refresh at every mutation site — there are
 * eight today, spread across the feed, product details, chat and the cart
 * screen itself. That only stays correct until someone adds a ninth and forgets.
 * Emitting from the service means every caller is covered, including future
 * ones, and screens don't have to know a badge exists.
 *
 * Services can't use hooks, hence a plain module rather than context.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to badge-affecting changes. Returns the unsubscribe function. */
export function onBadgeChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Called after any mutation that changes what the badge counts: cart writes for
 * a buyer, order-status writes for a seller.
 */
export function emitBadgeChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // One bad subscriber must not stop the others from being told.
    }
  });
}
