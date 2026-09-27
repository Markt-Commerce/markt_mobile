import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

/** Handles markt://payment/success?payment_id=... deep links via expo-router. */
export default function PaymentSuccessDeepLink() {
  const params = useLocalSearchParams<{
    payment_id?: string;
    reference?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: "/checkout/payment-result",
        params: {
          status: "success",
          payment_id: params.payment_id ?? "",
          reference: params.reference ?? "",
        },
      }}
    />
  );
}
