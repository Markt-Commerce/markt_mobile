/**
 * A one-line pub/sub so Home hears that the user's communities changed.
 *
 * Home caches its community chips for a minute (refetching on every return
 * trip was a request each time). That cache made a join invisible: join a
 * community, come back to Home, and its chip was missing until the minute
 * ran out. Emitted from the join/leave service calls so every screen that
 * joins -- Discover, the niche page, anything later -- is covered.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to membership changes. Returns the unsubscribe function. */
export function onNichesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called after the user joins or leaves a community. */
export function emitNichesChanged(): void {
  listeners.forEach((listener) => listener());
}
