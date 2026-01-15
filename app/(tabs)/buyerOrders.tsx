import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import OrdersList from "../../components/orderList";
import { getBuyerOrders } from "../../services/sections/orders";
import { ArrowLeft, RefreshCw, Info } from "lucide-react-native";
import { Order } from "../../models/orders";

type OrderStatus =
  | "all"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export default function BuyerOrders() {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOrders = useCallback(
    async (page: number) => {
      const data = await getBuyerOrders(page, 10);

      if (status === "all") return data;

      return data.filter(
        (order) => order.status?.toLowerCase() === status
      );
    },
    [status]
  );

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/orderdetail/${order.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#faf9f8]">
      {/* Top Bar */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              className="mr-2 h-10 w-10 rounded-full bg-white border border-[#efe9e7] items-center justify-center"
            >
              <ArrowLeft size={18} color="#171311" />
            </TouchableOpacity>
            <Text className="text-[22px] font-extrabold text-[#171311]">
              My Orders
            </Text>
          </View>
        </View>

        {/* Helper banner */}
        <View className="mt-3 flex-row items-start rounded-2xl bg-white border border-[#efe9e7] px-3 py-3">
          <View className="mt-0.5 mr-2">
            <Info size={18} color="#876d64" />
          </View>
          <View className="flex-1">
            <Text className="text-[#5f4f4f] text-sm">
              Track your purchases here. Orders update automatically as they
              progress.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRefresh}
            className="ml-2 h-9 px-3 rounded-full bg-[#f4f1f0] items-center justify-center"
          >
            <View className="flex-row items-center">
              <RefreshCw size={16} color="#171311" />
              <Text className="ml-1 text-xs font-semibold text-[#171311]">
                Refresh
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status legend */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          {[
            ["all", "All"],
            ["processing", "Processing"],
            ["shipped", "Shipped"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setStatus(key as OrderStatus)}
              className={`px-3 py-1.5 rounded-full border ${
                status === key
                  ? "bg-[#171311] border-[#171311]"
                  : "bg-white border-[#efe9e7]"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  status === key ? "text-white" : "text-[#171311]"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders container */}
      <View className="flex-1 px-4">
        <View className="flex-1 rounded-2xl bg-white border border-[#efe9e7] overflow-hidden">
          <OrdersList
            key={refreshKey}
            fetchOrders={fetchOrders}
            onPress={handleOrderPress}
          />
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
