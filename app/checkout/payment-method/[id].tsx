import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter,useLocalSearchParams } from "expo-router";
import { X, CreditCard, LucideBanknote as Bank } from "lucide-react-native";
import { initializePayment, initiatePayment } from "../../../services/sections/payments";
import { getOrderDetails } from "../../../services/sections/orders";
import { useToast } from "../../../components/ToastProvider";

export default function PaymentMethod() {
  const router = useRouter();
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
      router.push(`/checkout/payscreen/${paymentInitialization.access_code}`) // id in this case should be the initialization id
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
    <View className="flex-1 bg-white justify-between">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
          <TouchableOpacity onPress={() => router.back()} className="size-12 items-center justify-center">
            <X size={24} color="#181211" />
          </TouchableOpacity>
          </View>

          <View>
            <Text>
              <View className="px-4 pt-4">
                <Text className="text-lg font-bold mb-3">Choose payment method</Text>

                <TouchableOpacity
                  onPress={() => setSelectedMethod("card")}
                  className={`flex-row items-center p-3 rounded-lg mb-3 border ${selectedMethod === "card" ? "border-[#ea4a2a] bg-[#fff5f3]" : "border-gray-200 bg-white"}`}
                  activeOpacity={0.8}
                >
                  <View className="w-9 h-9 rounded-full items-center justify-center bg-white mr-3 shadow-sm">
                    <CreditCard size={20} color={selectedMethod === "card" ? "#ea4a2a" : "#181211"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold">Pay with card</Text>
                    <Text className="text-xs text-gray-500">Instant payment via Paystack</Text>
                  </View>
                  <View>
                    <Text className={`text-sm font-bold ${selectedMethod === "card" ? "text-[#ea4a2a]" : "text-gray-400"}`}>
                      {selectedMethod === "card" ? "Selected" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMethod("bank_transfer")}
                  className={`flex-row items-center p-3 rounded-lg mb-2 border ${selectedMethod === "bank_transfer" ? "border-[#ea4a2a] bg-[#fff5f3]" : "border-gray-200 bg-white"}`}
                  activeOpacity={0.8}
                >
                  <View className="w-9 h-9 rounded-full items-center justify-center bg-white mr-3 shadow-sm">
                    <Bank size={20} color={selectedMethod === "bank_transfer" ? "#ea4a2a" : "#181211"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold">Bank transfer</Text>
                    <Text className="text-xs text-gray-500">Use bank transfer through Paystack</Text>
                  </View>
                  <View>
                    <Text className={`text-sm font-bold ${selectedMethod === "bank_transfer" ? "text-[#ea4a2a]" : "text-gray-400"}`}>
                      {selectedMethod === "bank_transfer" ? "Selected" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Text className="text-xs text-gray-500">Order total</Text>
                  <Text className="text-xl font-bold">
                    {orderTotal
                      ? orderTotal.toLocaleString("en-NG", { style: "currency", currency: "NGN" })
                      : "NGN 0.00"}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-2">
                    You will be redirected to Paystack to complete the payment.
                  </Text>
                </View>
              </View>
            </Text>
          </View>
          
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
