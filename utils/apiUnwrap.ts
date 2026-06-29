/** Unwrap `{ data: T }` envelopes some Markt routes return. */
export function unwrapApi<T>(res: T | { data: T } | null | undefined): T {
  if (res && typeof res === "object" && "data" in res && (res as { data?: T }).data != null) {
    return (res as { data: T }).data;
  }
  return res as T;
}
