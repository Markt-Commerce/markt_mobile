import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { getPaymentDetails, verifyPayment } from "../../../services/sections/payments";
import { useTheme } from "../../../components/themeProvider";
import { useToast } from "../../../components/ToastProvider";
import {
  isPaymentCallbackUrl,
  isPaymentReturnUrl,
  parsePaymentDeepLink,
  paymentIdFromCallbackUrl,
} from "../../../utils/paymentDeepLink";

export default function PayScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { id, authorization_url, order_id } = useLocalSearchParams<{
    id: string;
    authorization_url?: string;
    order_id?: string;
  }>();

  const [checkoutUrl, setCheckoutUrl] = useState(authorization_url ?? "");
  const [loadingUrl, setLoadingUrl] = useState(!authorization_url);
  const [verifying, setVerifying] = useState(false);
  const handledReturn = useRef(false);

  useEffect(() => {
    if (authorization_url) {
      setCheckoutUrl(authorization_url);
      setLoadingUrl(false);
      return;
    }
    if (!id) return;
    setLoadingUrl(true);
    getPaymentDetails(id)
      .then((payment) => {
        const gatewayData = payment?.gateway_response?.data;
        const url =
          gatewayData?.authorization_url ||
          (gatewayData?.access_code
            ? `https://checkout.paystack.com/${gatewayData.access_code}`
            : "");
        setCheckoutUrl(url);
      })
      .catch(() => {
        show({
          variant: "error",
          title: "Payment unavailable",
          message: "Could not load Paystack checkout.",
        });
      })
      .finally(() => setLoadingUrl(false));
  }, [id, authorization_url, show]);

  const finishPayment = useCallback(
    async (status: "success" | "failed", paymentId: string, error?: string) => {
      if (handledReturn.current) return;
      handledReturn.current = true;
      setVerifying(true);
      try {
        if (status === "success") {
          await verifyPayment(paymentId);
        }
      } catch {
        // Verify is best-effort; payment-result will retry.
      } finally {
        setVerifying(false);
      }
      router.replace({
        pathname: "/checkout/payment-result",
        params: {
          status,
          payment_id: paymentId,
          order_id: order_id ?? "",
          error: error ?? "",
        },
      });
    },
    [order_id, router]
  );

  const handleReturnUrl = useCallback(
    (url: string) => {
      if (!isPaymentReturnUrl(url)) return false;

      // Stop at the backend's callback hop rather than letting the WebView try
      // to load it. That URL's host comes from the server's API_BASE_URL, and
      // when that is wrong the phone can't reach it -- the customer has already
      // paid (the webhook completes it either way) but they'd see
      // ERR_CONNECTION_REFUSED and never reach the result screen. finishPayment
      // verifies over the API, which doesn't care what API_BASE_URL says.
      if (isPaymentCallbackUrl(url)) {
        const paymentId = paymentIdFromCallbackUrl(url);
        if (paymentId) {
          finishPayment("success", paymentId);
          return true;
        }
      }

      const parsed = parsePaymentDeepLink(url);
      if (!parsed?.paymentId) {
        finishPayment("failed", id as string, parsed?.error ?? "Payment failed");
        return true;
      }
      finishPayment(parsed.status, parsed.paymentId, parsed.error);
      return true;
    },
    [finishPayment, id]
  );

  const onNavigationChange = (navState: WebViewNavigation) => {
    handleReturnUrl(navState.url);
  };

  if (loadingUrl || verifying) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center bg-surface-raised`}
      >
        <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        <Text className={`mt-3 text-sm text-text-secondary`}>
          {verifying ? "Confirming payment…" : "Loading Paystack…"}
        </Text>
      </SafeAreaView>
    );
  }

  if (!checkoutUrl) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center px-6 bg-surface-raised`}
      >
        <Text
          className={`text-center font-semibold text-text-primary`}
        >
          Payment link unavailable
        </Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 rounded bg-primary"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`ml-3 text-base font-semibold text-text-primary`}
        >
          Complete payment
        </Text>
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        className="flex-1 bg-surface-page"
        onNavigationStateChange={onNavigationChange}
        onShouldStartLoadWithRequest={(request) => {
          if (handleReturnUrl(request.url)) return false;
          return true;
        }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
