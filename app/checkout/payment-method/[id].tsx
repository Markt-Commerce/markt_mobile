import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, CreditCard, LucideBanknote as Bank, Wallet } from "lucide-react-native";
import {
  initializePayment,
  createPayment,
} from "../../../services/sections/payments";
import { getWallet } from "../../../services/sections/wallet";
import { getOrderDetails } from "../../../services/sections/orders";
import { useToast } from "../../../components/ToastProvider";
import { useTheme } from "../../../components/themeProvider";
import { getOrCreateIdempotencyKey } from "../../../utils/idempotency";
import { friendlyErrorMessage } from "../../../utils/errorMessages";
import type { PaymentMethod } from "../../../models/payments";

export default function PaymentMethod() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { show } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const orderId = id as string;

  useEffect(() => {
    if (!orderId) return;
    getOrderDetails(orderId)
      .then((order) => {
        setOrderTotal(order.total ?? 0);
        setOrderStatus(order.status ?? "");
      })
      .catch(() => {
        show({
          variant: "error",
          title: "Error",
          message: "Unable to fetch order details.",
        });
      });
  }, [orderId, show]);

  useEffect(() => {
    getWallet()
      .then((w) => setWalletBalance(w.available_balance))
      .catch(() => setWalletBalance(null));
  }, []);

  const formatMoney = (amount: number) =>
    amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" });

  const handleProceed = async () => {
    if (isProcessing || !orderId) return;

    if (orderStatus && orderStatus !== "pending_payment") {
      show({
        variant: "info",
        title: "Already paid",
        message: "This order is no longer awaiting payment.",
      });
      router.replace(`/orderdetail/${orderId}`);
      return;
    }

    setIsProcessing(true);
    const idempotencyKey = getOrCreateIdempotencyKey(`pay-${orderId}`);

    try {
      if (selectedMethod === "wallet") {
        if (walletBalance != null && walletBalance < orderTotal) {
          show({
            variant: "error",
            title: "Insufficient balance",
            message: `Wallet balance is ${formatMoney(walletBalance)}. Top up or pay with card.`,
          });
          setIsProcessing(false);
          return;
        }

        // Send amount explicitly: the deployed backend 500s (KeyError) when
        // the optional `amount` key is absent from the payload. It must match
        // order.total, which is exactly what we fetched.
        const payment = await createPayment({
          method: "wallet",
          currency: "NGN",
          order_id: orderId,
          amount: orderTotal > 0 ? orderTotal : undefined,
          metadata: { platform: "mobile" },
          idempotency_key: idempotencyKey,
        });

        if (payment.status === "completed") {
          router.replace({
            pathname: "/checkout/payment-result",
            params: {
              status: "success",
              payment_id: payment.id,
              order_id: orderId,
            },
          });
        } else {
          show({
            variant: "error",
            title: "Wallet payment failed",
            message: "Could not complete wallet payment.",
          });
        }
        return;
      }

      // Paystack's hosted checkout page (authorization_url) offers card, bank
      // transfer, and USSD — but the backend only returns an authorization_url
      // for method "card", so route the bank-transfer option through it too.
      const init = await initializePayment({
        method: "card",
        currency: "NGN",
        order_id: orderId,
        amount: orderTotal > 0 ? orderTotal : undefined,
        metadata: { platform: "mobile", chosen_method: selectedMethod },
        idempotency_key: idempotencyKey,
      });

      router.push({
        pathname: `/checkout/payscreen/${init.payment_id}`,
        params: {
          authorization_url: init.authorization_url,
          order_id: orderId,
        },
      });
    } catch (err) {
      show({
        variant: "error",
        title: "Payment error",
        message: friendlyErrorMessage(err, "Could not start the payment. Please try again."),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const methods: {
    id: PaymentMethod;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    disabled?: boolean;
  }[] = [
    {
      id: "card",
      title: "Pay with card",
      subtitle: "Instant payment via Paystack",
      icon: <CreditCard size={20} color={isDark ? "#f0f1f2" : "#000000"} />,
    },
    {
      id: "bank_transfer",
      title: "Bank transfer",
      subtitle: "Pay via bank transfer on Paystack",
      icon: <Bank size={20} color={isDark ? "#f0f1f2" : "#000000"} />,
    },
    {
      id: "wallet",
      title: "Markt wallet",
      subtitle:
        walletBalance != null
          ? `Balance: ${formatMoney(walletBalance)}`
          : "Pay instantly from wallet",
      icon: <Wallet size={20} color={isDark ? "#f0f1f2" : "#000000"} />,
      disabled: walletBalance != null && walletBalance < orderTotal,
    },
  ];

  return (
    <SafeAreaView
      className={`flex-1 justify-between bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView>
        <View
          className={`flex-row items-center p-4 pb-2 justify-between bg-surface-raised`}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="size-12 items-center justify-center"
          >
            <X size={24} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-4">
          <Text
            className={`text-lg font-bold mb-3 text-text-primary`}
          >
            Choose payment method
          </Text>

          {methods.map((m) => {
            const selected = selectedMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                disabled={m.disabled}
                onPress={() => setSelectedMethod(m.id)}
                className={`flex-row items-center p-3 rounded mb-3 border ${
                  selected
                    ? `border-primary bg-surface-sunken`
                    : isDark
                      ? "border-border-strong bg-surface-raised"
                      : "border-border bg-white"
                } ${m.disabled ? "opacity-50" : ""}`}
                activeOpacity={0.8}
              >
                <View
                  className={`w-9 h-9 rounded items-center justify-center mr-3 border ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}
                >
                  {m.icon}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-semibold text-text-primary`}
                  >
                    {m.title}
                  </Text>
                  <Text
                    className={`text-xs text-text-secondary`}
                  >
                    {m.subtitle}
                  </Text>
                </View>
                {selected ? (
                  <Text
                    className={`text-xs font-bold text-text-primary`}
                  >
                    Selected
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}

          <View className={`mt-4 p-3 rounded bg-surface-sunken`}>
            <Text className={`text-xs text-text-secondary`}>
              Order total
            </Text>
            <Text
              className={`text-xl font-bold text-text-primary`}
            >
              {orderTotal ? formatMoney(orderTotal) : "NGN 0.00"}
            </Text>
            {selectedMethod !== "wallet" ? (
              <Text
                className={`text-xs mt-2 text-text-secondary`}
              >
                You will complete payment on Paystack.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View className={`px-4 py-3 bg-surface-raised`}>
        <TouchableOpacity
          onPress={handleProceed}
          disabled={isProcessing}
          className={`flex-row items-center justify-center h-12 rounded ${isProcessing ? "bg-primary/60" : "bg-primary"}`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-white text-sm font-bold tracking-[0.015em]">
            {isProcessing ? "Processing…" : "Proceed"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
