import React, { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { parsePaymentDeepLink } from "../utils/paymentDeepLink";

/**
 * Global listener for Paystack return deep links:
 * markt://payment/success|failed?payment_id=...&reference=...
 */
export default function PaymentDeepLinkHandler() {
  const router = useRouter();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const navigate = (url: string) => {
      const parsed = parsePaymentDeepLink(url);
      if (!parsed?.paymentId) return;
      const key = `${parsed.status}:${parsed.paymentId}:${parsed.reference ?? ""}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);

      router.push({
        pathname: "/checkout/payment-result",
        params: {
          status: parsed.status,
          payment_id: parsed.paymentId,
          reference: parsed.reference ?? "",
          error: parsed.error ?? "",
        },
      });
    };

    Linking.getInitialURL().then((url) => {
      if (url) navigate(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => navigate(url));
    return () => sub.remove();
  }, [router]);

  return null;
}
