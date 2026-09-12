/**
 * Auth storage
 * - auth_token: bearer token, in the Keychain (iOS) / Keystore (Android)
 * - user_session: persisted user + timestamp for app restart (7-day expiry)
 *
 * The token moved out of AsyncStorage deliberately. AsyncStorage is
 * **unencrypted** -- plain text on a rooted or jailbroken device, and readable
 * from an unencrypted device backup. It holds a 30-day bearer token that is a
 * full credential for the account, so SecureStore (Keychain / Keystore) is the
 * right home for it and AsyncStorage is not.
 *
 * The *session* blob stays in AsyncStorage on purpose: it is a display cache
 * (email, role, timestamp) with no credential in it, SecureStore has a 2KB
 * value limit, and its reads are markedly slower -- paying that on every cold
 * start to protect a username would be the wrong trade.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { clearAllIdempotencyKeys } from "../utils/idempotency";
import { logger } from "../utils/logger";

// SecureStore keys must be alphanumeric plus ".-_" -- the old "@markt_..."
// name is not a legal key here.
const AUTH_TOKEN_KEY = "markt_auth_token";
/** The AsyncStorage key the token used to live under, for the one-time move. */
const LEGACY_AUTH_TOKEN_KEY = "@markt_auth_token";
const USER_SESSION_KEY = "user_session";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days per guide

export type StoredUser = { email: string; account_type: "buyer" | "seller"; user_id?: string };
export type StoredSession = { user: StoredUser; role: "buyer" | "seller"; timestamp: number };

// --- Bearer token, in the device keystore ---

/**
 * Move a token written by an older build out of AsyncStorage.
 *
 * Runs at most once per install: without it, everyone already signed in would
 * be logged out by this change, and their old plaintext token would be left
 * behind in AsyncStorage forever.
 */
async function migrateLegacyToken(): Promise<string | null> {
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
    if (!legacy) return null;
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacy);
    // Only removed once the secure write succeeded, so a failure here cannot
    // strand a signed-in user with no token in either place.
    await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    logger.info("auth: migrated bearer token from AsyncStorage to SecureStore");
    return legacy;
  } catch (e) {
    logger.warn("auth: legacy token migration failed", e);
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch (e) {
    // A locked keystore or a device that cannot do secure storage. Treated as
    // signed out rather than crashing the request layer.
    logger.warn("auth: could not read the secure store", e);
  }
  return migrateLegacyToken();
}

export async function setAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
        // The token is only ever used by a foreground request, so it does not
        // need to be readable while the device is locked.
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    logger.warn("auth: could not write the secure store", e);
  }
  // Always clear the legacy copy, so signing out never leaves a live token
  // behind in plaintext.
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY).catch(() => {});
}

export function extractTokenFromResponse(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const token =
    data.access_token ?? data.token ?? data.data?.access_token ?? data.data?.token ?? null;
  return typeof token === "string" ? token : null;
}

// --- user_session (guide: store user + timestamp for session persistence) ---
export async function setUserSession(user: StoredUser, role: "buyer" | "seller"): Promise<void> {
  await AsyncStorage.setItem(
    USER_SESSION_KEY,
    JSON.stringify({ user, role, timestamp: Date.now() } as StoredSession)
  );
}

export async function clearUserSession(): Promise<void> {
  // Sign-out must take the credential with it, not just the display cache.
  await setAuthToken(null);
  // Idempotency keys are per-login-session: a new account on this device must
  // never reuse them (the backend would replay the previous account's orders).
  clearAllIdempotencyKeys();
  await AsyncStorage.removeItem(USER_SESSION_KEY);
}

export async function getStoredUser(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    const age = Date.now() - (session?.timestamp ?? 0);
    if (age > SESSION_MAX_AGE_MS) {
      await clearUserSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await getStoredUser();
  return session != null;
}
