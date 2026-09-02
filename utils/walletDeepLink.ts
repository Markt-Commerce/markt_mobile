import * as Linking from "expo-linking";

export type WalletDeepLinkResult = {
  status: "success" | "failed";
  topupId?: string;
  amount?: string;
  error?: string;
};

/**
 * Parse markt://wallet/success|failed?topup_id=...&amount=...&error=...
 *
 * Emitted by the backend's wallet top-up callback route, which Paystack
 * redirects the browser to after a top-up (see WalletTopUpCallback).
 */
export function parseWalletDeepLink(url: string): WalletDeepLinkResult | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? "";
    const hostname = parsed.hostname ?? "";

    // Only wallet returns — the payment ones are handled separately and share
    // the same success/failed suffix.
    const isWallet = path.includes("wallet") || hostname === "wallet";
    if (!isWallet) return null;

    let status: "success" | "failed" | null = null;
    if (path.includes("success")) status = "success";
    else if (path.includes("failed")) status = "failed";
    else return null;

    const q = parsed.queryParams ?? {};
    return {
      status,
      topupId: (q.topup_id as string | undefined) ?? undefined,
      amount: (q.amount as string | undefined) ?? undefined,
      error: (q.error as string | undefined) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function isWalletReturnUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("markt://wallet/")) return true;
  return parseWalletDeepLink(url) != null;
}
