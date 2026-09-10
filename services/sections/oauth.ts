import { request, BASE_URL } from "../api";
import { setAuthToken, extractTokenFromResponse } from "../authStorage";

/**
 * POST /users/auth/oauth — exchange a provider identity token for a Markt
 * session.
 *
 * One endpoint for both providers and for both new and returning users: the
 * app cannot know which of those it is until the backend has verified the
 * token, and making it guess would turn a wrong guess into a dead end mid
 * sign-in.
 */
export type OAuthProvider = "google" | "apple";

export interface OAuthSignInPayload {
  provider: OAuthProvider;
  identity_token: string;
  /** Echoed back by Apple; the backend checks it to block token replay. */
  nonce?: string;
  /** Apple gives the name once, on first authorisation, outside the token. */
  full_name?: string;
}

/** Thrown when the email already belongs to a password account (409). */
export class AccountExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountExistsError";
  }
}

export async function signInWithProvider(payload: OAuthSignInPayload) {
  try {
    const res = await request<any>(`${BASE_URL}/users/auth/oauth`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const token = extractTokenFromResponse(res);
    if (token) await setAuthToken(token);
    return res?.data ?? res;
  } catch (e: any) {
    // The backend distinguishes "this email is already a password account"
    // from every other failure, because only that one has a specific recovery
    // path: sign in once with the password to link the provider.
    const code = e?.data?.errors?.code ?? e?.errors?.code;
    if (e?.status === 409 || code === "ACCOUNT_EXISTS") {
      throw new AccountExistsError(
        e?.message ??
          "That email already has a Markt account. Sign in with your password once to connect it."
      );
    }
    throw e;
  }
}
