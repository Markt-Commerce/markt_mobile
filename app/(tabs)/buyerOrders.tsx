import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import OrdersList from "../../components/orderList";
import { getBuyerOrders } from "../../services/sections/orders";
import { ArrowLeft, RefreshCw, Info } from "lucide-react-native";
import { Order } from "../../models/orders";
import { useTheme } from "../../components/themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
    console.log("Pressed order:", order.id);
    router.push(`/orderdetail/${order.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      {/* Top Bar */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              className={`mr-3 h-10 w-10 rounded items-center justify-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
            >
              <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
            </TouchableOpacity>
            <Text className={`text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              My Orders
            </Text>
          </View>
        </View>

        {/* Helper banner */}
        <View className={`mt-4 flex-row items-start rounded border px-4 py-4 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
          <View className="mt-0.5 mr-3">
            <Info size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
          </View>
          <View className="flex-1">
            <Text className={`font-inter text-sm leading-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Track your purchases here. Orders update automatically as they
              progress.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRefresh}
            className={`ml-3 h-10 px-4 rounded items-center justify-center border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
          >
            <View className="flex-row items-center">
              <RefreshCw size={16} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.5} />
              <Text className={`ml-1 text-xs font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                Refresh
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status legend */}
        <View className="mt-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
          >
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
                className={`px-5 py-2.5 rounded border ${
                  status === key
                    ? "bg-primary border-primary"
                    : isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-xs font-geist font-bold ${
                    status === key ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Orders container */}
      <View className="flex-1 px-6 mt-2">
        <View className={`flex-1 rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <OrdersList
            key={refreshKey}
            fetchOrders={fetchOrders}
            pressed={handleOrderPress}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
