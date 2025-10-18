import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrdersList from "../../components/orderList";
import { ArrowLeft, RefreshCw, Info } from "lucide-react-native";

const fetchBuyerOrders = async (page: number) => {
  // Dummy data for now
  return new Promise<any[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          page > 2
            ? []
            : [
                { id: "#789012", status: "Shipped", total: "$150.00", progress: 75 },
                { id: "#901234", status: "Processing", total: "$220.00", progress: 25 },
              ]
        ),
      1000
    )
  );
};

export default function BuyerOrders() {
  return (
    <SafeAreaView className="flex-1 bg-[#faf9f8]">
      {/* Top Bar */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.7}
              className="mr-2 h-10 w-10 rounded-full bg-white border border-[#efe9e7] items-center justify-center"
            >
              <ArrowLeft size={18} color="#171311" />
            </TouchableOpacity>
            <Text className="text-[22px] font-extrabold text-[#171311]">My Orders</Text>
          </View>

        </View>

        {/* Helper banner */}
        <View className="mt-3 flex-row items-start rounded-2xl bg-white border border-[#efe9e7] px-3 py-3">
          <View className="mt-0.5 mr-2">
            <Info size={18} color="#876d64" />
          </View>
          <View className="flex-1">
            <Text className="text-[#5f4f4f] text-sm">
              Track your purchases here. Orders update automatically as they progress.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            className="ml-2 h-9 px-3 rounded-full bg-[#f4f1f0] items-center justify-center"
            onPress={() => {}}
          >
            <View className="flex-row items-center">
              <RefreshCw size={16} color="#171311" />
              <Text className="ml-1 text-xs font-semibold text-[#171311]">Refresh</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status legend */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <View className="px-3 py-1.5 rounded-full bg-white border border-[#efe9e7]">
            <Text className="text-xs font-semibold text-[#171311]">All</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-[#f0f9ff] border border-[#dbeafe]">
            <Text className="text-xs font-semibold text-[#0c4a6e]">Processing</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-[#fefce8] border border-[#fde68a]">
            <Text className="text-xs font-semibold text-[#854d0e]">Shipped</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0]">
            <Text className="text-xs font-semibold text-[#14532d]">Delivered</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-[#fef2f2] border border-[#fecaca]">
            <Text className="text-xs font-semibold text-[#7f1d1d]">Cancelled</Text>
          </View>
        </View>
      </View>

      {/* Orders container */}
      <View className="flex-1 px-4">
        <View className="flex-1 rounded-2xl bg-white border border-[#efe9e7] overflow-hidden">
          {/* Your component (kept exactly the same prop) */}
          <OrdersList fetchOrders={fetchBuyerOrders} />
        </View>

        {/* Footer helper */}
        <View className="py-4 items-center">
          <Text className="text-[#8e7a74] text-xs">
            Need help? Visit Support · Refund Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
