// services/config.ts
//
// Single source of truth for backend endpoints.
//
// Values come from Expo public env vars (EXPO_PUBLIC_*), which Metro inlines at
// build time. When unset, we fall back to the test backend so local/dev runs keep
// working without a .env file. Set these in .env (see .env.example) or via the EAS
// build profile for production.

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://test.api.marktcommerce.com/api/v1";

export const SOCKET_BASE_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? "https://test.api.marktcommerce.com";

/** Socket.IO chat namespace URL, derived from SOCKET_BASE_URL. */
export const CHAT_SOCKET_URL = `${SOCKET_BASE_URL}/chat`;
