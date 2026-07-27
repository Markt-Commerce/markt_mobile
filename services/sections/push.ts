import { request, BASE_URL } from "../api";

/** Register this device's Expo push token with the backend (remote push). */
export async function registerPushToken(
  token: string,
  platform: string
): Promise<void> {
  await request<void>(`${BASE_URL}/notifications/push-token`, {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

/** Remove the token on logout so the server stops pushing to this device. */
export async function unregisterPushToken(token: string): Promise<void> {
  await request<void>(`${BASE_URL}/notifications/push-token`, {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}
