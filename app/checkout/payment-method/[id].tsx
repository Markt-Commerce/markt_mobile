import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter,useLocalSearchParams } from "expo-router";
import { X, CreditCard, LucideBanknote as Bank } from "lucide-react-native";
import { initiatePayment } from "../../../services/sections/payments";
import { getOrderDetails } from "../../../services/sections/orders";
import { useToast } from "../../../components/ToastProvider";

export default function PaymentMethod() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = React.useState<"card" | "bank" | null>(null);
  const [orderTotal, setOrderTotal] = React.useState<number>(0);
  const { show } = useToast();

  const determinePaymentDirection = () => {
    try {
      initiatePayment({
        method: selectedMethod as string,
        currency: "NGN",
        order_id: useLocalSearchParams().id as string,
        amount: orderTotal,
        metadata: {},
      });
      if (selectedMethod === "card") 
        router.push("/checkout/card-info");
      if (selectedMethod === "bank") 
        router.push("/checkout/payment-info");
    } catch (error) {
      show({
        variant: "error",
        title: "Error",
        message: "Unable to initiate payment.",
      });
    }
    
    return null;
  };


  const getOrderTotal = async () => {
    try {
      const id = useLocalSearchParams().id as string;
      const orderDetails = await getOrderDetails(id);
      setOrderTotal(orderDetails.total || 0);
    } catch (error) {
      show({
        variant: "error",
        title: "Error",
        message: "Unable to fetch order total.",
      })
      return 0;
    }
  }

  useEffect(() => {
    // Fetch order total on mount
    getOrderTotal();
  }, []);

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
            N{orderTotal.toFixed(2)}
          </Text>
        </View>

        {/* Card Option */}
        <TouchableOpacity onPress={() => setSelectedMethod("card")}
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
        <TouchableOpacity onPress={() => setSelectedMethod("bank")}
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
          onPress={() => determinePaymentDirection()}
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
