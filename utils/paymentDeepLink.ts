import * as Linking from "expo-linking";

export type PaymentDeepLinkResult = {
  status: "success" | "failed";
  paymentId?: string;
  reference?: string;
  error?: string;
};

/** Parse markt://payment/success|failed?payment_id=...&reference=...&error=... */
export function parsePaymentDeepLink(url: string): PaymentDeepLinkResult | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? "";
    const hostname = parsed.hostname ?? "";

    let status: "success" | "failed" | null = null;
    if (path.includes("success") || hostname === "success") status = "success";
    else if (path.includes("failed") || hostname === "failed") status = "failed";
    else return null;

    const q = parsed.queryParams ?? {};
    const paymentId =
      (q.payment_id as string | undefined) ??
      (q.paymentId as string | undefined);
    const reference = q.reference as string | undefined;
    const error = q.error as string | undefined;

    return { status, paymentId, reference, error };
  } catch {
    return null;
  }
}

export function isPaymentReturnUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("markt://payment/")) return true;
  if (isPaymentCallbackUrl(url)) return true;
  return parsePaymentDeepLink(url) != null;
}

/**
 * The backend's own callback route, which Paystack redirects the browser to
 * before *it* redirects on to markt://payment/…
 *
 * Worth matching separately, because that intermediate hop is the fragile one:
 * its host comes from the server's API_BASE_URL, and if that is unset or points
 * at localhost the phone cannot reach it. The customer has already paid at that
 * point — the webhook completes the payment regardless — but the browser lands
 * on ERR_CONNECTION_REFUSED and they never reach the result screen.
 *
 * The wallet top-up flow was fixed for exactly this; checkout has the same
 * shape and was missed. Recognising the URL by its *path* lets the app stop
 * before loading it and verify over the API instead.
 */
export function isPaymentCallbackUrl(url: string): boolean {
  return !!url && url.includes("/payments/callback/");
}

/** The payment id embedded in that callback path, if present. */
export function paymentIdFromCallbackUrl(url: string): string | undefined {
  const match = url.match(/\/payments\/callback\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
