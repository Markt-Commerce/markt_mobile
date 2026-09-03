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
  if (isWalletCallbackUrl(url)) return true;
  return parseWalletDeepLink(url) != null;
}

/**
 * The backend's own callback route, which Paystack redirects the browser to
 * before *it* redirects on to markt://wallet/…
 *
 * Worth matching separately, because that intermediate hop is the fragile one:
 * its host comes from the server's API_BASE_URL, and if that is unset or points
 * at localhost the phone can't reach it. The customer has already paid at that
 * point — the webhook credits the wallet regardless — but the browser lands on
 * ERR_CONNECTION_REFUSED and it looks like the money vanished.
 *
 * Recognising the URL by its *path* lets the app stop before loading it and
 * verify over the API instead, so a server misconfiguration can't strand
 * someone who has already paid.
 */
export function isWalletCallbackUrl(url: string): boolean {
  return !!url && url.includes("/wallet/topup/callback/");
}

/** The top-up id embedded in that callback path, if present. */
export function topupIdFromCallbackUrl(url: string): string | undefined {
  const match = url.match(/\/wallet\/topup\/callback\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
