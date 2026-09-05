import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { verifyPayment } from "../../services/sections/payments";
import { getOrderDetails } from "../../services/sections/orders";
import type { Order } from "../../models/orders";
import { useTheme } from "../../components/themeProvider";
import { clearIdempotencyKey } from "../../utils/idempotency";
import { friendlyErrorMessage } from "../../utils/errorMessages";

export default function PaymentResult() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { status, payment_id, order_id, error } = useLocalSearchParams<{
    status?: string;
    payment_id?: string;
    order_id?: string;
    error?: string;
  }>();

  const isSuccess = status === "success";
  const [loading, setLoading] = useState(isSuccess);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuccess || !payment_id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await verifyPayment(payment_id);
        if (cancelled) return;
        setVerified(result.verified === true);
        // Payment-first checkout has no order_id route param (no order
        // existed when payscreen launched) — the verify response is the
        // only place it's learned from, once payment completes it.
        const effectiveOrderId = order_id || result.order_id;
        if (effectiveOrderId) {
          const orderData = await getOrderDetails(effectiveOrderId);
          if (!cancelled) setOrder(orderData);
        }
        if (effectiveOrderId) clearIdempotencyKey(`pay-${effectiveOrderId}`);
      } catch (err) {
        if (!cancelled) {
          setVerifyError(
            friendlyErrorMessage(err, "Could not verify your payment. If you were charged, it will be reconciled shortly.")
          );
        }
      } finally {
        // Retired here too, regardless of how verification went. It is
        // primarily cleared at checkout; leaving it alive after a failed
        // verify would let the next checkout replay this order.
        clearIdempotencyKey("checkout-cart");
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSuccess, payment_id, order_id]);

  const resolvedOrderId = order_id || order?.id;

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-1 items-center justify-center px-6">
        {loading ? (
          <>
            <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
            <Text className={`mt-4 text-sm text-text-secondary`}>
              Confirming your payment…
            </Text>
          </>
        ) : (
          <>
            {isSuccess && verified ? (
              <CheckCircle2 size={64} color="#178b1f" />
            ) : isSuccess ? (
              <CheckCircle2 size={64} color="#eab308" />
            ) : (
              <XCircle size={64} color="#dc2626" />
            )}

            <Text
              className={`mt-6 text-2xl font-bold text-center text-text-primary`}
            >
              {isSuccess
                ? verified
                  ? "Payment successful"
                  : "Payment received"
                : "Payment failed"}
            </Text>

            <Text
              className={`mt-2 text-sm text-center text-text-secondary`}
            >
              {isSuccess
                ? verified
                  ? order?.status === "ready_for_delivery"
                    ? "Your order is ready for delivery."
                    : "Payment confirmed. Your order is being processed."
                  : verifyError ??
                    "We could not confirm payment yet. Check your orders shortly."
                : error?.trim() ||
                  "Your payment was not completed. You can try again."}
            </Text>

            {order?.order_number ? (
              <Text
                className={`mt-4 text-sm font-semibold text-text-primary`}
              >
                Order {order.order_number}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {!loading && (
        <View className="px-6 pb-8 gap-3">
          {resolvedOrderId ? (
            <TouchableOpacity
              className="h-12 rounded bg-primary items-center justify-center"
              onPress={() => router.replace(`/orderdetail/${resolvedOrderId}`)}
            >
              <Text className="text-white font-semibold">View order</Text>
            </TouchableOpacity>
          ) : null}

          {!isSuccess && resolvedOrderId ? (
            <TouchableOpacity
              className={`h-12 rounded border items-center justify-center border-border-strong`}
              onPress={() =>
                router.replace(`/checkout/payment-method/${resolvedOrderId}`)
              }
            >
              <Text className={`font-semibold text-text-primary`}>
                Retry payment
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            className="h-12 items-center justify-center"
            onPress={() => router.replace("/(tabs)/orders")}
          >
            <Text className={`font-semibold text-text-secondary`}>
              Back to orders
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
