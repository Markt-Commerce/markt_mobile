import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Loading order…</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6">
        {/* Header */}
        <View className="flex-row items-center py-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 h-10 w-10 rounded bg-surface border border-border items-center justify-center"
          >
            <ArrowLeft size={20} color="#000000" />
          </TouchableOpacity>
          <Text className="text-xl font-geist font-bold text-black">
            Order #{order.id}
          </Text>
        </View>

        {/* Status */}
        <View className="rounded bg-white border border-border p-6 mb-6">
          <Text className="text-xs font-geist font-bold uppercase tracking-wider text-tertiary">Status</Text>
          <Text className="text-xl font-geist font-bold text-black mt-2 capitalize">
            {order.status}
          </Text>
        </View>

        {/* Items */}
        <View className="rounded bg-white border border-border p-6 mb-6">
          <Text className="font-geist font-bold text-lg text-black mb-4">Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} className="mb-3">
              <Text className="text-base font-geist font-bold text-black">
                {item.product?.name}
              </Text>
              <Text className="text-xs font-inter text-tertiary mt-1">
                Qty: {item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View className="rounded bg-white border border-border p-6 mb-10">
          <Text className="font-geist font-bold text-lg text-black mb-4">Summary</Text>

          <Row label="Subtotal" value={order.subtotal} />
          <Row label="Shipping" value={order.shipping_fee} />
          <Row label="Tax" value={order.tax} />
          <Row label="Discount" value={order.discount} />

          <View className="h-px bg-border my-4" />

          <Row
            label="Total"
            value={order.total}
            bold
          />
        </View>

        <View className="flex pb-10">
          <TouchableOpacity className="bg-primary h-12 rounded justify-center items-center relative" onPress={() => router.push(`/orders/${id}/track`)}>
            <Text className="text-white font-geist font-bold text-base">Track Order</Text>
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
}: {
  label: string;
  value?: number;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className={`text-sm font-inter ${bold ? "font-geist font-bold text-black" : "text-tertiary"}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? "font-geist font-bold text-black" : "font-inter text-black"}`}>
        ₦{(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}
