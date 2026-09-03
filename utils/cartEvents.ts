/**
 * A one-line pub/sub so the cart service can tell the cart badge that the cart
 * changed.
 *
 * The alternative was calling refreshCart() at every mutation site — there are
 * eight today, spread across the feed, product details, chat and the cart
 * screen itself. That only stays correct until someone adds a ninth and forgets.
 * Emitting from the service means every caller is covered, including future
 * ones, and screens don't have to know a badge exists.
 *
 * Services can't use hooks, hence a plain module rather than context.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to cart changes. Returns the unsubscribe function. */
export function onCartChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the cart service after any mutation. */
export function emitCartChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // One bad subscriber must not stop the others from being told.
    }
  });
}
