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

// --- Social sign-in client IDs ------------------------------------------------
//
// Public by design: an OAuth client ID is not a secret (it ships inside every
// app binary regardless). The *audience check* on the backend is what makes a
// token trustworthy, not the secrecy of this value.
//
// The web client ID is required even on mobile — it is what makes Google return
// an `idToken` at all. Without it you get an access token, which the backend
// cannot verify as an identity. See SETUP_OAUTH.md.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

/** Whether Google sign-in can be offered at all on this build. */
export const IS_GOOGLE_CONFIGURED = GOOGLE_WEB_CLIENT_ID.length > 0;
