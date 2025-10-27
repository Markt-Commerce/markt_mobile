import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { X, CreditCard, LucideBanknote as Bank } from "lucide-react-native";

export default function PaymentMethod() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-between">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <X size={24} color="#181211" />
          </TouchableOpacity>
          <Text className="text-[#181211] text-lg font-bold text-center flex-1 pr-12">
            Payment method
          </Text>
        </View>

        {/* Total */}
        <View>
          <Text className="text-[#181211] text-lg font-bold px-4 pb-2 pt-4">
            Total
          </Text>
          <Text className="text-[#181211] text-[22px] font-bold px-4 pb-3 pt-5">
            $120.00
          </Text>
        </View>

        {/* Card Option */}
        <TouchableOpacity
          className="flex-row items-center gap-4 bg-white px-4 py-2 min-h-[72px]"
          activeOpacity={0.7}
        >
          <View className="bg-[#f4f1f0] rounded-lg items-center justify-center w-12 h-12">
            <CreditCard size={24} color="#181211" />
          </View>
          <View className="flex-1">
            <Text className="text-[#181211] text-base font-medium">
              Card
            </Text>
            <Text className="text-[#886963] text-sm">
              Redirects to external website
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bank Option */}
        <TouchableOpacity
          className="flex-row items-center gap-4 bg-white px-4 py-2 min-h-[56px]"
          activeOpacity={0.7}
        >
          <View className="bg-[#f4f1f0] rounded-lg items-center justify-center w-10 h-10">
            <Bank size={24} color="#181211" />
          </View>
          <Text className="text-[#181211] text-base flex-1 truncate">
            Direct from Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Proceed Button */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={() => router.push("/checkout/payment-info")}
          className="flex items-center justify-center bg-[#ea4a2a] h-10 rounded-lg"
        >
          <Text className="text-white text-sm font-bold tracking-[0.015em]">
            Proceed
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}
