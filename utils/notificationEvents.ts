/**
 * A one-line pub/sub so a screen or push handler can tell the notification
 * bell badge that unread state changed, without importing a context into
 * places that can't use hooks (see utils/badgeEvents.ts for the identical
 * pattern used by the Orders tab badge).
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to unread-notification changes. Returns the unsubscribe function. */
export function onNotificationsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called after any mutation or event that changes the unread notification count. */
export function emitNotificationsChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // One bad subscriber must not stop the others from being told.
    }
  });
}
