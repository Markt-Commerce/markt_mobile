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
