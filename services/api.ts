// services/api.ts
import { BaseError, MarshMellowError, NetworkError, APIError, BasicAPIError } from "../models/errors";

export const BASE_URL = 'https://test.api.marktcommerce.com/api/v1';

export async function request<T = any>(path: string, opts: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };

  // If NOT FormData, set a JSON content-type (if caller didn't)
  const isFormData = opts.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';

    // OPTIONAL: if caller passed a plain object, stringify it once here.
    // (Keeps server happy and avoids accidental double reads from streams.)
    if (opts.body && typeof opts.body === 'object' && typeof (opts.body as any).append !== 'function') {
      opts = { ...opts, body: JSON.stringify(opts.body) };
    }
  }

  const res = await fetch(url, {
    credentials: 'include', // keep session cookie auth
    ...opts,
    headers,
  });

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
    // Reuse the parsed `data` (do NOT call res.json() again)
    const errorBody = data as any;

    // Marshmallow-style validation errors
    const mmErrors = errorBody?.errors?.json ?? errorBody?.errors;
    if (mmErrors && typeof mmErrors === 'object') {
      const errorMessages = Object.entries(mmErrors)
        .map(([field, messages]) =>
          `${field}: ${(Array.isArray(messages) ? messages : [messages]).join(', ')}`
        )
        .join('; ');
      throw new Error(errorMessages || `Request failed with status ${res.status}`);
    }

    const msg =
      errorBody?.message ||
      (typeof errorBody === 'string' ? errorBody : '') ||
      res.statusText ||
      `Request failed with status ${res.status}`;

    throw new Error(msg);
  }

  return data as T;
}
