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
  return parsePaymentDeepLink(url) != null;
}
