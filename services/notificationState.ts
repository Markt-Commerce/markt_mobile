/**
 * The small AsyncStorage state behind notifications: last-open time, pending
 * cart count, push token, and per-type send timestamps.
 *
 * Deliberately free of any `expo-notifications` import. That module throws at
 * load time in Expo Go, and anything importing it transitively (auth → NavDrawer
 * → every tab route) fails to evaluate. Callers that only need this state — see
 * services/sections/auth.ts and services/sections/cart.ts — import from here so
 * they never reach the native module. services/notifications.ts re-exports
 * everything below, so existing imports from there keep working.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- storage keys ------------------------------------------------------------
const K_LAST_OPEN = "notif.lastAppOpen";
const K_CART_COUNT = "notif.cartCount";
const K_PUSH_TOKEN = "notif.pushToken";
const K_SENT_PREFIX = "notif.sent.";

export type ReminderType = "reengagement" | "cart" | "gamification";

export async function setStoredPushToken(token: string) {
  await AsyncStorage.setItem(K_PUSH_TOKEN, token);
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(K_PUSH_TOKEN);
}

// --- background-worker state -------------------------------------------------
export async function markAppOpened() {
  await AsyncStorage.setItem(K_LAST_OPEN, new Date().toISOString());
}

export async function getLastAppOpen(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(K_LAST_OPEN);
  return raw ? new Date(raw) : null;
}

/** The app caches its pending cart count so the worker needs no network. */
export async function setPendingCartCount(count: number) {
  await AsyncStorage.setItem(K_CART_COUNT, String(count));
}

export async function getPendingCartCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(K_CART_COUNT);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

/** True if a reminder of this type was already sent within `withinHours`. */
export async function sentRecently(
  type: ReminderType,
  withinHours: number
): Promise<boolean> {
  const raw = await AsyncStorage.getItem(K_SENT_PREFIX + type);
  if (!raw) return false;
  const last = new Date(raw).getTime();
  return Date.now() - last < withinHours * 3600_000;
}

export async function markSent(type: ReminderType) {
  await AsyncStorage.setItem(K_SENT_PREFIX + type, new Date().toISOString());
}

export function hoursSince(date: Date | null): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / 3600_000;
}
