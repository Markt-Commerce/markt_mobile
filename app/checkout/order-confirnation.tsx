import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPaymentDetails } from "../../services/sections/payments";
import { Transaction } from "../../models/payments";
import { useTheme } from "../../components/themeProvider";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { payment_id } = useLocalSearchParams();

  const [transaction, setTransaction] = useState<Transaction>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (payment_id) {
      getPaymentDetails(payment_id as string)
        .then(setTransaction)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [payment_id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
      <ScrollView
        className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      >
        <View className="items-center mb-6">
          <CheckCircle2 size={96} color="#178b1f" />
        </View>

        <Text className={`text-2xl font-geist font-bold text-center mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Order placed successfully!
        </Text>
        <Text className={`text-base text-center mb-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          You'll receive a confirmation shortly.
        </Text>

        <View className={`rounded p-5 mb-8 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
          <Text className={`text-lg font-geist font-bold mb-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Order Summary</Text>

          {loading ? (
            <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
          ) : (
            <>
              <View className="flex-row justify-between mb-2">
                <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Order ID</Text>
                <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {transaction?.order_id ?? "—"}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Payment Method</Text>
                <Text className={`font-medium capitalize ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {transaction?.method?.replace("_", " ") ?? "—"}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Total Amount</Text>
                <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {transaction?.amount
                    ? transaction.amount.toLocaleString("en-NG", { style: "currency", currency: transaction.currency ?? "NGN" })
                    : "—"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Status</Text>
                <Text className={`font-medium capitalize ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {transaction?.status ?? "—"}
                </Text>
              </View>
            </>
          )}
        </View>

        <View className="flex gap-3">
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-primary h-12 rounded flex items-center justify-center"
          >
            <Text className="text-white text-base font-bold">Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/buyerOrders")}
            className={`border h-12 rounded flex items-center justify-center ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}
          >
            <Text className={`text-base font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
