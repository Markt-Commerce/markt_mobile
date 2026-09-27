// services/api.ts
import { getAuthToken, setAuthToken, clearUserSession } from "./authStorage";
import { API_BASE_URL } from "./config";

/** Re-exported for the many callers that import BASE_URL from here. Source of truth: config.ts */
export const BASE_URL = API_BASE_URL;

/** Called on 401 — register from UserProvider to clear context and redirect */
let onUnauthorized: (() => void) | null = null;

/**
 * Endpoints where a 401 means "those credentials are wrong", not "your
 * session ended".
 *
 * Signing in with the wrong password returns 401, which used to run the
 * session-expiry path: clear the token, drop the user, toast "Session
 * expired — please sign in again", and navigate to the guest home. So
 * mistyping a password threw you out to the create-account screen, told
 * you a session you never had had expired, and unmounted the login screen
 * before its own "Incorrect email or password" could be read.
 *
 * These are the paths that *establish* a session rather than spend one.
 */
const CREDENTIAL_PATHS = [
  "/users/login",
  "/users/register",
  "/users/auth/oauth",
  "/users/email-verification/verify",
  "/users/password-reset",
  "/users/password-reset/confirm",
  "/deliveries/auth/login",
  "/deliveries/auth/otp",
];

function isCredentialCheck(url: string): boolean {
  // Compare on the path only: query strings and the host vary.
  const path = url.split("?")[0].replace(/\/+$/, "");
  return CREDENTIAL_PATHS.some((p) => path.endsWith(p));
}
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

/** How long to wait before giving up on a request.
 *
 * React Native's fetch has no timeout at all: a request to a slow or
 * unreachable host stays pending forever, and every caller that shows a
 * "Sending…" state sits in it until the app is killed. That is what a hang
 * in this app has always been -- not a bug in the screen, but a promise
 * nobody was ever going to settle.
 *
 * Generous rather than snappy, because the backend genuinely is slow
 * sometimes and cutting off a request that would have succeeded is its own
 * kind of broken. The point is that it ends.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/** Uploads get much longer: a couple of photos on mobile data is minutes,
 *  and the user is watching a progress state that means something. */
const UPLOAD_TIMEOUT_MS = 120_000;

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/** fetch, but it always finishes. */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new TimeoutError(
        "That took too long. Check your connection and try again."
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };

  // Attach Bearer token for auth (React Native doesn't persist cookies like a browser)
  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If NOT FormData, set a JSON content-type (if caller didn't)
  const isFormData = opts.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";

    if (opts.body && typeof opts.body === "object" && typeof (opts.body as any).append !== "function") {
      opts = { ...opts, body: JSON.stringify(opts.body) };
    }
  }

  const fetchOpts: RequestInit = {
    credentials: "include",
    ...opts,
    headers,
  };

  const timeoutMs = isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, fetchOpts, timeoutMs);
  } catch (networkErr) {
    // A timeout is an answer, not a routing problem. Retrying it with a
    // different slash would just wait another thirty seconds.
    if (networkErr instanceof TimeoutError) throw networkErr;

    // Slash-mismatch safety net: some backend routes 308-redirect between
    // `/path` and `/path/`, and behind the proxy the redirect URL is built with
    // a cleartext http scheme, which release Android builds refuse to follow —
    // that surfaces here as a bare network failure. The server never processed
    // the request (it only redirected), so retrying with the trailing slash
    // toggled is safe. A genuine offline failure just fails again and we
    // rethrow the original error.
    const qIdx = url.indexOf("?");
    const pathPart = qIdx === -1 ? url : url.slice(0, qIdx);
    const queryPart = qIdx === -1 ? "" : url.slice(qIdx);
    const toggledPath = pathPart.endsWith("/")
      ? pathPart.slice(0, -1)
      : `${pathPart}/`;
    try {
      res = await fetchWithTimeout(`${toggledPath}${queryPart}`, fetchOpts, timeoutMs);
    } catch {
      throw networkErr;
    }
  }

  // No body
  if (res.status === 204 || res.status === 205) return undefined as unknown as T;

  // --- Parse the body ONCE ---
  const raw = await res.text();
  let data: any;
  try {
    data = raw ? JSON.parse(raw) : undefined;
  } catch {
    data = raw; // non-JSON responses fall back to text
  }

  if (!res.ok) {
    const errorBody = data as any;

    // 401 = the session is gone → clear it and send them to sign in.
    //
    // Unless this *was* the sign-in. A rejected password is an answer to a
    // question the user just asked, and the screen that asked it is the
    // right place to say so.
    if (res.status === 401 && !isCredentialCheck(url)) {
      await setAuthToken(null);
      await clearUserSession();
      onUnauthorized?.();
    }
    // 403 = logged in but not allowed (wrong role, etc.) → do NOT clear session or redirect
    // Let the caller show "Switch to seller" or "Create seller account"

    const mmErrors = errorBody?.errors?.json ?? errorBody?.errors;
    const msg =
      mmErrors && typeof mmErrors === "object"
        ? Object.entries(mmErrors)
            .map(([field, messages]) =>
              `${field}: ${(Array.isArray(messages) ? messages : [messages]).join(", ")}`
            )
            .join("; ")
        : errorBody?.message ||
          (typeof errorBody === "string" ? errorBody : "") ||
          res.statusText ||
          `Request failed with status ${res.status}`;

    const err = new Error(msg) as Error & { status?: number; body?: any };
    err.status = res.status;
    // The parsed body, so callers can branch on what the server actually
    // said rather than on the shape of its prose. Without it the only way to
    // recognise "this account has not verified its email" was to substring
    // -match the message, which breaks the moment anyone rewords it.
    err.body = errorBody;
    throw err;
  }

  return data as T;
}

