import { BASE_URL, request } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";

export interface WalletBalance {
  currency: string;
  available_balance: number;
}

export async function getWallet(): Promise<WalletBalance> {
  // Trailing slash: `/wallet` 308-redirects to cleartext http, which release
  // Android blocks.
  const res = await request<WalletBalance | { data: WalletBalance }>(
    `${BASE_URL}/wallet/`,
    { method: "GET" }
  );
  return unwrapApi(res);
}

export interface WalletTopUpInit {
  amount: number;
  currency?: string;
  platform?: string;
}

export interface WalletTopUpResponse {
  topup_id: string;
  amount: number;
  currency: string;
  authorization_url: string;
  reference: string;
}

export async function initializeWalletTopUp(
  body: WalletTopUpInit
): Promise<WalletTopUpResponse> {
  const res = await request<WalletTopUpResponse | { data: WalletTopUpResponse }>(
    `${BASE_URL}/wallet/topup/initialize`,
    {
      method: "POST",
      body: JSON.stringify({
        currency: "NGN",
        platform: "mobile",
        ...body,
      }),
    }
  );
  return unwrapApi(res);
}

export interface WalletTopUpVerification {
  topup_id: string;
  status: string;
  verified: boolean;
  amount: number;
  currency: string;
}

/**
 * Confirm a top-up once the Paystack webview returns.
 *
 * The client is never the authority on whether money moved — this asks the
 * server, which asks Paystack. The webhook is the primary path; this is what
 * lets the balance update immediately instead of whenever the webhook lands.
 */
export async function verifyWalletTopUp(
  topupId: string
): Promise<WalletTopUpVerification> {
  const res = await request<
    WalletTopUpVerification | { data: WalletTopUpVerification }
  >(`${BASE_URL}/wallet/topup/${topupId}/verify`, { method: "GET" });
  return unwrapApi(res);
}

export interface WalletTransaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  balance_after: number;
  reference_type: string;
  reference_id: string;
  description: string | null;
  created_at: string | null;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: Pagination;
}

export async function getWalletTransactions(
  page = 1,
  perPage = 20
): Promise<WalletTransactionsResponse> {
  const res = await request<
    WalletTransactionsResponse | { data: WalletTransactionsResponse }
  >(`${BASE_URL}/wallet/transactions?page=${page}&per_page=${perPage}`, {
    method: "GET",
  });
  const data = unwrapApi(res);
  return {
    transactions: data?.transactions ?? [],
    pagination: data?.pagination ?? {
      page,
      per_page: perPage,
      total_items: 0,
      total_pages: 0,
    },
  };
}

export interface WithdrawalRequestBody {
  amount: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  currency?: string;
}

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | string;

/**
 * What POST /wallet/withdraw returns. Deliberately narrower than the list
 * shape below — the create endpoint serializes through
 * WithdrawalResponseSchema and sends only these five fields.
 */
export interface WithdrawalReceipt {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  created_at: string | null;
}

/** What GET /wallet/withdrawals returns per row. */
export interface Withdrawal extends WithdrawalReceipt {
  account_name: string;
  /** Masked server-side — only the last four digits are ever sent. */
  account_number: string;
  paystack_transfer_ref: string | null;
  failure_reason: string | null;
}

/** Minimum enforced by the backend (MIN_WITHDRAWAL_AMOUNT). */
export const MIN_WITHDRAWAL_AMOUNT = 1000;

/** Minimum enforced by the backend's initialize_topup. */
export const MIN_TOPUP_AMOUNT = 100;

export async function requestWithdrawal(
  body: WithdrawalRequestBody
): Promise<WithdrawalReceipt> {
  const res = await request<WithdrawalReceipt | { data: WithdrawalReceipt }>(
    `${BASE_URL}/wallet/withdraw`,
    {
      method: "POST",
      body: JSON.stringify({ currency: "NGN", ...body }),
    }
  );
  return unwrapApi(res);
}

export interface WithdrawalListResponse {
  withdrawals: Withdrawal[];
  pagination: Pagination;
}

export async function getWithdrawals(
  page = 1,
  perPage = 20
): Promise<WithdrawalListResponse> {
  const res = await request<WithdrawalListResponse | { data: WithdrawalListResponse }>(
    `${BASE_URL}/wallet/withdrawals?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  const data = unwrapApi(res);
  return {
    withdrawals: data?.withdrawals ?? [],
    pagination: data?.pagination ?? {
      page,
      per_page: perPage,
      total_items: 0,
      total_pages: 0,
    },
  };
}
