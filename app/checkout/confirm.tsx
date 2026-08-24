import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../components/themeProvider";

/** 11.5: itemised fee breakdown, shown before the buyer is sent to
 * Paystack. Params come straight from POST /payments/checkout/initialize's
 * response (see cart.tsx) — no order exists yet, so there's nothing to
 * re-fetch here. */
export default function CheckoutConfirm() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [proceeding, setProceeding] = useState(false);

  const {
    payment_id,
    authorization_url,
    subtotal,
    shipping_fee,
    service_fee,
    reliability_fee_opted_in,
    reliability_fee_estimate,
    capture_ceiling,
    amount,
  } = useLocalSearchParams<{
    payment_id: string;
    authorization_url?: string;
    subtotal: string;
    shipping_fee: string;
    service_fee: string;
    reliability_fee_opted_in: string;
    reliability_fee_estimate: string;
    capture_ceiling: string;
    amount: string;
  }>();

  const reliabilityOptedIn = reliability_fee_opted_in === "true";

  const formatMoney = (n: string | number | undefined) => {
    const v = typeof n === "string" ? Number(n) : n ?? 0;
    try {
      return Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
      }).format(v);
    } catch {
      return `₦${(v || 0).toFixed(2)}`;
    }
  };

  const handlePayNow = () => {
    if (proceeding || !payment_id) return;
    setProceeding(true);
    router.push({
      pathname: `/checkout/payscreen/${payment_id}`,
      params: { authorization_url: authorization_url ?? "" },
    });
  };

  const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
    <View className="flex-row justify-between py-2">
      <Text className={`text-sm font-inter ${muted ? (isDark ? "text-[#c6c5cf]" : "text-tertiary") : isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        {label}
      </Text>
      <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView
      className={`flex-1 justify-between ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView>
        <View className={`flex-row items-center px-4 py-3 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
          <Text className={`ml-3 text-lg font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Confirm order
          </Text>
        </View>

        <View className="px-6 mt-2">
          <View className={`rounded border p-6 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Row label="Subtotal" value={formatMoney(subtotal)} muted />
            <Row label="Shipping fee" value={formatMoney(shipping_fee)} muted />
            <Row label="Service fee" value={formatMoney(service_fee)} muted />
            {reliabilityOptedIn ? (
              <Row
                label="Reliability fee (estimate)"
                value={formatMoney(reliability_fee_estimate)}
                muted
              />
            ) : null}

            <View className={`h-[1px] my-4 ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
            <Row label="Total charged today" value={formatMoney(amount)} />

            <Text className={`text-xs font-inter mt-4 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {reliabilityOptedIn
                ? `Max you could be charged (worst case, if a substitution happens): ${formatMoney(capture_ceiling)}.`
                : `Max you could be charged (worst case, if a substitution happens): ${formatMoney(capture_ceiling)}. This excludes the reliability fee since you didn't opt in.`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className={`px-4 py-3 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <TouchableOpacity
          onPress={handlePayNow}
          disabled={proceeding || !payment_id}
          className={`flex-row items-center justify-center h-12 rounded ${proceeding || !payment_id ? "bg-primary/60" : "bg-primary"}`}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {proceeding ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-white text-sm font-geist font-bold tracking-[0.015em]">
            {proceeding ? "Redirecting…" : "Pay now"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
