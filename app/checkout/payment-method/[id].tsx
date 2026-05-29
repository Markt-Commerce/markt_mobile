import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter,useLocalSearchParams } from "expo-router";
import { X, CreditCard, LucideBanknote as Bank } from "lucide-react-native";
import { initializePayment, initiatePayment } from "../../../services/sections/payments";
import { getOrderDetails } from "../../../services/sections/orders";
import { useToast } from "../../../components/ToastProvider";
import { useTheme } from "../../../components/themeProvider";

export default function PaymentMethod() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedMethod, setSelectedMethod] = React.useState<"card" | "bank_transfer">("card");
  const [orderTotal, setOrderTotal] = React.useState<number>(0);
  const { show } = useToast();
  const { id } = useLocalSearchParams();

  const determinePaymentDirection = async () => {
    try {
      const paymentInitialization = await initializePayment({
        method: selectedMethod,
        currency: "NGN",
        order_id: id as string,
        amount: orderTotal,
        metadata: {},
      });
      router.push(`/checkout/payscreen/${paymentInitialization.payment_id}`) // id in this case should be the initialization id
    } catch (error) {
      console.log(error)
      show({
        variant: "error",
        title: "Error",
        message: "Unable to initiate payment.",
      });
    }
    
    return null;
  };


  const getOrderTotal = async (id: string) => {
    try {
      const orderDetails = await getOrderDetails(id);
      console.log("order id:", id);
      console.log("Order details fetched:", orderDetails);
      setOrderTotal(orderDetails.total || 0);
    } catch (error) {
      show({
        variant: "error",
        title: "Error",
        message: "Unable to fetch order total.",
      })
      console.error("Error fetching order total:", error);
      return 0;
    }
  }

  useEffect(() => {
    // Fetch order total on mount
    getOrderTotal(id as string);
  }, [id]);

  return (
    <View className={`flex-1 justify-between ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
      <ScrollView>
        {/* Header */}
        <View className={`flex-row items-center p-4 pb-2 justify-between ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <X size={24} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-4">
          <Text className={`text-lg font-geist font-bold mb-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Choose payment method</Text>

          <TouchableOpacity
            onPress={() => setSelectedMethod("card")}
            className={`flex-row items-center p-3 rounded mb-3 border ${
              selectedMethod === "card" ? "border-primary" + (isDark ? " bg-[#2f3132]" : " bg-surface") : (isDark ? "border-[#46464e] bg-[#1a1c1d]" : "border-border bg-white")
            }`}
            activeOpacity={0.8}
          >
            <View className={`w-9 h-9 rounded items-center justify-center mr-3 border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              <CreditCard size={20} color={selectedMethod === "card" ? (isDark ? "#f0f1f2" : "#000000") : (isDark ? "#c6c5cf" : "#71717A")} />
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Pay with card</Text>
              <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Instant payment via Paystack</Text>
            </View>
            <View>
              <Text className={`text-sm font-bold ${selectedMethod === "card" ? (isDark ? "text-[#f0f1f2]" : "text-black") : (isDark ? "text-[#c6c5cf]" : "text-tertiary")}`}>
                {selectedMethod === "card" ? "Selected" : ""}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMethod("bank_transfer")}
            className={`flex-row items-center p-3 rounded mb-2 border ${
              selectedMethod === "bank_transfer" ? "border-primary" + (isDark ? " bg-[#2f3132]" : " bg-surface") : (isDark ? "border-[#46464e] bg-[#1a1c1d]" : "border-border bg-white")
            }`}
            activeOpacity={0.8}
          >
            <View className={`w-9 h-9 rounded items-center justify-center mr-3 border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              <Bank size={20} color={selectedMethod === "bank_transfer" ? (isDark ? "#f0f1f2" : "#000000") : (isDark ? "#c6c5cf" : "#71717A")} />
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Bank transfer</Text>
              <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Use bank transfer through Paystack</Text>
            </View>
            <View>
              <Text className={`text-sm font-bold ${selectedMethod === "bank_transfer" ? (isDark ? "text-[#f0f1f2]" : "text-black") : (isDark ? "text-[#c6c5cf]" : "text-tertiary")}`}>
                {selectedMethod === "bank_transfer" ? "Selected" : ""}
              </Text>
            </View>
          </TouchableOpacity>

          <View className={`mt-4 p-3 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Order total</Text>
            <Text className={`text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              {orderTotal
                ? orderTotal.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
                : "NGN 0.00"}
            </Text>
            <Text className={`text-xs mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              You will be redirected to Paystack to complete the payment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View className={`px-4 py-3 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <TouchableOpacity
          onPress={() => determinePaymentDirection()}
          className="flex items-center justify-center bg-primary h-12 rounded"
        >
          <Text className="text-white text-sm font-geist font-bold tracking-[0.015em]">
            Proceed
          </Text>
        </TouchableOpacity>
      </View>

      <View className={`h-5 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} />
    </View>
  );
}
