import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { useTheme } from "../../components/themeProvider";

export default function OrderConfirmationScreen({ navigation }: any) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
    <ScrollView
      className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      {/* Success Icon */}
      <View className="items-center mb-6">
        <CheckCircle2 size={96} color="#178b1f" />
      </View>

      {/* Success Message */}
      <Text className={`text-2xl font-geist font-bold text-center mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        Order placed successfully!
      </Text>
      <Text className={`text-base text-center mb-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
        You’ll receive a confirmation email shortly.
      </Text>

      {/* Summary Card */}
      <View className={`rounded p-5 mb-8 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
        <Text className={`text-lg font-geist font-bold mb-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Order Summary</Text>
        <View className="flex-row justify-between mb-2">
          <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Order ID</Text>
          <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>#MKT123456</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Payment Method</Text>
          <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Direct from Account</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Total Amount</Text>
          <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>€245.90</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className={isDark ? "text-[#c6c5cf]" : "text-tertiary"}>Estimated Delivery</Text>
          <Text className={`font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>3–5 business days</Text>
        </View>
      </View>

      {/* Buttons */}
      <View className="flex gap-3">
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          className="bg-primary h-12 rounded flex items-center justify-center"
        >
          <Text className="text-white text-base font-bold">Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Orders")}
          className={`border h-12 rounded flex items-center justify-center ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}
        >
          <Text className={`text-base font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>View Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
