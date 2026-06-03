import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { getOrderDetails } from "../../services/sections/orders";
import { Order } from "../../models/orders";
import { useTheme } from "../../components/themeProvider";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f5f5f5" : "#000000";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(id);
        setOrder(data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${isDark ? "bg-dark-page" : "bg-white"}`}
      >
        <Text className={isDark ? "text-dark-text" : "text-black"}>
          Loading order...
        </Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center ${isDark ? "bg-dark-page" : "bg-white"}`}
      >
        <Text className={isDark ? "text-dark-text" : "text-black"}>
          Order not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      <ScrollView className="px-6">
        {/* Header */}
        <View className="flex-row items-center py-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`mr-4 h-10 w-10 rounded border items-center justify-center ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`}
          >
            <ArrowLeft size={20} color={iconColor} />
          </TouchableOpacity>
          <Text
            className={`text-xl font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
          >
            Order #{order.id}
          </Text>
        </View>

        {/* Status */}
        <View
          className={`rounded border p-6 mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
        >
          <Text className="text-xs font-geist font-bold uppercase tracking-wider text-tertiary">
            Status
          </Text>
          <Text
            className={`text-xl font-geist font-bold mt-2 capitalize ${isDark ? "text-dark-text" : "text-black"}`}
          >
            {order.status}
          </Text>
        </View>

        {/* Items */}
        <View
          className={`rounded border p-6 mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
        >
          <Text
            className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-dark-text" : "text-black"}`}
          >
            Items
          </Text>
          {order.items?.map((item, index) => (
            <View key={index} className="mb-3">
              <Text
                className={`text-base font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {item.product?.name}
              </Text>
              <Text className="text-xs font-inter text-tertiary mt-1">
                Qty: {item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View
          className={`rounded border p-6 mb-10 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
        >
          <Text
            className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-dark-text" : "text-black"}`}
          >
            Summary
          </Text>

          <Row label="Subtotal" value={order.subtotal} isDark={isDark} />
          <Row label="Shipping" value={order.shipping_fee} isDark={isDark} />
          <Row label="Tax" value={order.tax} isDark={isDark} />
          <Row label="Discount" value={order.discount} isDark={isDark} />

          <View
            className={`h-px my-4 ${isDark ? "bg-dark-border" : "bg-border"}`}
          />

          <Row label="Total" value={order.total} bold isDark={isDark} />
        </View>

        <View className="flex pb-10">
          <TouchableOpacity
            className="bg-primary h-12 rounded justify-center items-center relative"
            onPress={() => router.push(`/orders/${id}/track`)}
          >
            <Text className="text-white font-geist font-bold text-base">
              Track Order
            </Text>
            <ArrowRight size={20} color="#fff" className="absolute right-6" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  isDark,
}: {
  label: string;
  value?: number;
  bold?: boolean;
  isDark: boolean;
}) {
  return (
    <View className="flex-row justify-between py-2">
      <Text
        className={`text-sm font-inter ${bold ? `font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}` : "text-tertiary"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? "font-geist font-bold" : "font-inter"} ${isDark ? "text-dark-text" : "text-black"}`}
      >
        ₦{(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}
