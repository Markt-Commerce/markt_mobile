import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react-native";
import { getOrderDetails } from "../../services/sections/orders";
import { Order } from "../../models/orders";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Loading order…</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#faf9f8]">
      <ScrollView className="px-4">
        {/* Header */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 rounded-full bg-white border border-[#efe9e7] items-center justify-center"
          >
            <ArrowLeft size={18} color="#171311" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-[#171311]">
            Order #{order.order_number}
          </Text>
        </View>

        {/* Status */}
        <View className="rounded-2xl bg-white border border-[#efe9e7] p-4 mb-4">
          <Text className="text-xs text-[#8e7a74]">Status</Text>
          <Text className="text-lg font-bold text-[#171311] capitalize">
            {order.status}
          </Text>
        </View>

        {/* Items */}
        <View className="rounded-2xl bg-white border border-[#efe9e7] p-4 mb-4">
          <Text className="font-bold text-[#171311] mb-3">Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} className="mb-2">
              <Text className="text-sm font-semibold text-[#171311]">
                {item.product?.name}
              </Text>
              <Text className="text-xs text-[#8e7a74]">
                Qty: {item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View className="rounded-2xl bg-white border border-[#efe9e7] p-4 mb-6">
          <Text className="font-bold text-[#171311] mb-2">Summary</Text>

          <Row label="Subtotal" value={order.subtotal} />
          <Row label="Shipping" value={order.shipping_fee} />
          <Row label="Tax" value={order.tax} />
          <Row label="Discount" value={order.discount} />

          <View className="h-px bg-[#efe9e7] my-2" />

          <Row
            label="Total"
            value={order.total}
            bold
          />
        </View>

        <View className="flex">
          <TouchableOpacity onPress={()=> router.push(`/orders/${id}/track`)}>
            <Text>
              Track Order
            </Text>
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
}: {
  label: string;
  value?: number;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`text-sm ${bold ? "font-bold" : ""}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? "font-bold" : ""}`}>
        ₦{(value ?? 0).toFixed(2)}
      </Text>
    </View>
  );
}
