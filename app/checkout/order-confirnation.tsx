import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

export default function OrderConfirmationScreen({ navigation }: any) {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      {/* Success Icon */}
      <View className="items-center mb-6">
        <CheckCircle2 size={96} color="#e26136" />
      </View>

      {/* Success Message */}
      <Text className="text-[#171311] text-2xl font-extrabold text-center mb-2">
        Order placed successfully!
      </Text>
      <Text className="text-[#876d64] text-base text-center mb-6">
        You’ll receive a confirmation email shortly.
      </Text>

      {/* Summary Card */}
      <View className="bg-[#f4f1f0] rounded-2xl p-5 mb-8 shadow-sm">
        <Text className="text-[#171311] text-lg font-bold mb-3">Order Summary</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-[#876d64]">Order ID</Text>
          <Text className="text-[#171311] font-medium">#MKT123456</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-[#876d64]">Payment Method</Text>
          <Text className="text-[#171311] font-medium">Direct from Account</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-[#876d64]">Total Amount</Text>
          <Text className="text-[#171311] font-medium">€245.90</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[#876d64]">Estimated Delivery</Text>
          <Text className="text-[#171311] font-medium">3–5 business days</Text>
        </View>
      </View>

      {/* Buttons */}
      <View className="flex gap-3">
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          className="bg-[#e26136] h-12 rounded-xl flex items-center justify-center"
        >
          <Text className="text-white text-base font-bold">Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Orders")}
          className="border border-[#e26136] h-12 rounded-xl flex items-center justify-center"
        >
          <Text className="text-[#e26136] text-base font-bold">View Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
