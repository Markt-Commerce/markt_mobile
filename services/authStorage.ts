/**
 * Auth storage 
 * - user_session: persisted user + timestamp for app restart (7-day expiry)
 * - auth_token: Bearer token fallback if backend supports it (cookies may not work in RN)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@markt_auth_token";
const USER_SESSION_KEY = "user_session";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days per guide

export type StoredUser = { email: string; account_type: "buyer" | "seller"; user_id?: string };
export type StoredSession = { user: StoredUser; role: "buyer" | "seller"; timestamp: number };

// --- Bearer token (fallback when cookies don't persist in RN) ---
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  else await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
