// api.ts
export const BASE_URL = 'https://test.api.marktcommerce.com/api/v1';

export async function request<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}
