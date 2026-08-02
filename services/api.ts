// services/api.ts
import { getAuthToken, setAuthToken, clearUserSession } from "./authStorage";
import { API_BASE_URL } from "./config";

/** Re-exported for the many callers that import BASE_URL from here. Source of truth: config.ts */
export const BASE_URL = API_BASE_URL;

/** Called on 401 — register from UserProvider to clear context and redirect */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
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

  let res: Response;
  try {
    res = await fetch(url, fetchOpts);
  } catch (networkErr) {
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
      res = await fetch(`${toggledPath}${queryPart}`, fetchOpts);
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

    // 401 = not logged in → clear session, redirect to login
    if (res.status === 401) {
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

    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

