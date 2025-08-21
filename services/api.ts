import { BaseError,MarshMellowError,NetworkError,APIError,BasicAPIError } from "../models/errors";

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
    if (errorBody.errors) {
      // Handle MarshMellowError type
      const marshmallowError: MarshMellowError = {
        errors: errorBody.errors,
        status: res.status.toString(),
        code: res.status,
      };
      //combine all the errors in marshmallowError.errors.json into a single error message
      const errorMessages = Object.entries(marshmallowError.errors.json)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      throw new Error(errorMessages || `Request failed with status ${res.status}`);
    }
    throw new Error(errorBody.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}
