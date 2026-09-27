/** In-memory idempotency keys — reuse on retry within the same app session. */
const sessionKeys = new Map<string, string>();

function newKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Get or create a stable idempotency key for a scope (e.g. checkout-cart, pay-ORD_xxx). */
export function getOrCreateIdempotencyKey(scope: string): string {
  const existing = sessionKeys.get(scope);
  if (existing) return existing;
  const key = `markt-${scope}-${newKey()}`;
  sessionKeys.set(scope, key);
  return key;
}

export function clearIdempotencyKey(scope: string): void {
  sessionKeys.delete(scope);
}

/** Drop every cached key — call when the auth session changes (logout/401),
 * otherwise the next account on this device reuses the previous account's
 * keys and the backend replays their orders/payments. */
export function clearAllIdempotencyKeys(): void {
  sessionKeys.clear();
}
