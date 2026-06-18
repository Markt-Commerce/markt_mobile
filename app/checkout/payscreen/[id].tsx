import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPaymentDetails, verifyPayment } from "../../../services/sections/payments";
import { Transaction } from "../../../models/payments";
import { useTheme } from "../../../components/themeProvider";

export default function PaymentInfo() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // id here is the payment_id, not the transaction id
  const { id } = useLocalSearchParams();

  const [paymentdata, setPaymentdata] = useState<Transaction>();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (id) {
      getPaymentDetails(id as string)
        .then(setPaymentdata)
        .catch(console.error);
    }
  }, [id]);

  const gatewayData = paymentdata?.gateway_response.data;
  const checkoutUrl =
    gatewayData?.authorization_url ||
    (gatewayData?.access_code ? `https://checkout.paystack.com/${gatewayData.access_code}` : "");

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const { url } = request;
    if (url.startsWith("markt://payment/success")) {
      const queryString = url.split("?")[1] ?? "";
      const params: Record<string, string> = queryString
        .split("&")
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, pair) => {
          const [k, v] = pair.split("=").map(decodeURIComponent);
          acc[k] = v;
          return acc;
        }, {});
      const paymentId = params.payment_id ?? (id as string);
      setVerifying(true);
      verifyPayment(paymentId)
        .then(() => {
          router.replace(`/checkout/order-confirnation?payment_id=${paymentId}`);
        })
        .catch((err) => {
          console.error("Payment verification failed:", err);
          setVerifying(false);
        });
      return false;
    }
    return true;
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
      {verifying ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      ) : (
        <WebView
          source={{ uri: checkoutUrl }}
          style={{ marginTop: 20, backgroundColor: isDark ? "#1a1c1d" : "white" }}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
      )}
    </View>
  );
}
