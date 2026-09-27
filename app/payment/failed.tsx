import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

/** Handles markt://payment/failed?payment_id=... deep links via expo-router. */
export default function PaymentFailedDeepLink() {
  const params = useLocalSearchParams<{
    payment_id?: string;
    reference?: string;
    error?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: "/checkout/payment-result",
        params: {
          status: "failed",
          payment_id: params.payment_id ?? "",
          reference: params.reference ?? "",
          error: params.error ?? "",
        },
      }}
    />
  );
}
