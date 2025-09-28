import { BaseError,MarshMellowError,NetworkError,APIError,BasicAPIError } from "../models/errors";

export const BASE_URL = 'https://test.api.marktcommerce.com/api/v1';

export async function request<T = any>(path: string, opts: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: Record<string,string> = {
    'Accept': 'application/json',
    ...(opts.headers as Record<string,string> || {})
  };

  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(url, {
    credentials: 'include', // session cookie auth
    ...opts,
    headers,
  });

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (data?.errors) {
      // Handle MarshMellowError type
      const marshmallowError: MarshMellowError = {
        errors: data.errors,
        status: res.status.toString(),
        code: res.status,
      };
      //combine all the errors in marshmallowError.errors.json into a single error message
      const errorMessages = Object.entries(marshmallowError.errors.json)
        .map(([field, messages]) => `${field}: ${messages}`)
        .join('; ');
      throw new Error(errorMessages || `Request failed with status ${res.status}`);
    }
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}