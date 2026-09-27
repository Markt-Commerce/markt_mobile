/**
 * Account lifecycle — deletion.
 *
 * Apple App Store guideline 5.1.1(v) requires an account created in the app to
 * be deletable from inside the app. The backend anonymizes rather than drops
 * the row (other people's posts, reviews and order history reference it), and
 * refuses while the user still holds money or has orders in flight.
 */

import { BASE_URL, request } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";
import { getStoredPushToken } from "../notificationState";
import { unregisterPushToken } from "./push";
import { setAuthToken, clearUserSession } from "../authStorage";

export interface AccountDeletionBlocker {
  code:
    | "wallet_balance"
    | "open_orders_buying"
    | "open_orders_selling"
    | "pending_payments"
    | string;
  message: string;
  detail?: Record<string, unknown>;
}

export interface AccountDeletionCheck {
  can_delete: boolean;
  blockers: AccountDeletionBlocker[];
}

/**
 * What stands between this account and deletion. Asked up front so the screen
 * can explain what to resolve rather than surfacing a failed delete.
 */
export async function checkAccountDeletion(): Promise<AccountDeletionCheck> {
  const res = await request<AccountDeletionCheck | { data: AccountDeletionCheck }>(
    `${BASE_URL}/users/account/deletion-check`,
    { method: "GET" }
  );
  const data = unwrapApi(res);
  return { can_delete: data?.can_delete ?? false, blockers: data?.blockers ?? [] };
}

export interface AccountDeletionResult {
  deleted: boolean;
  user_id: string;
  message: string;
}

/**
 * Irreversible. On success the local session is cleared, because the bearer
 * token stops authenticating server-side the moment the account is marked
 * deleted and keeping it would only produce confusing 401s.
 *
 * A failure (wrong password, or a blocker appearing between the check and the
 * delete) deliberately leaves the session intact — the user is still signed in
 * and should be able to correct the problem and retry.
 */
export async function deleteAccount(password: string): Promise<AccountDeletionResult> {
  // Unregister this device first, while the token is still valid, or the
  // backend is left holding a push token for a deleted account.
  try {
    const token = await getStoredPushToken();
    if (token) await unregisterPushToken(token);
  } catch {
    /* non-fatal */
  }

  const res = await request<AccountDeletionResult | { data: AccountDeletionResult }>(
    `${BASE_URL}/users/account`,
    {
      method: "DELETE",
      body: JSON.stringify({ password, confirmation: "DELETE" }),
    }
  );

  await setAuthToken(null);
  await clearUserSession();
  return unwrapApi(res);
}
