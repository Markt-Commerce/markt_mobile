import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

interface OrderCardProps {
  order: any;
  onPress?: () => void;
  isSeller?: boolean;
}

export default function OrderCard({ order, onPress, isSeller }: OrderCardProps) {
  return (
    <TouchableOpacity
      className="flex-row justify-between gap-4 bg-white px-4 py-3 border-b border-[#eee]"
      onPress={onPress}
    >
      <View className="flex-row gap-4 flex-1">
        {order.image && (
          <Image source={{ uri: order.image }} className="w-[70px] aspect-[3/4] rounded-lg" />
        )}
        <View className="flex-1 justify-center">
          <Text className="text-base font-medium text-[#171311]">
            {isSeller ? `From: ${order.from}` : `Order ${order.id}`}
          </Text>
          <Text className="text-sm text-[#876d64]">
            {isSeller ? `Product: ${order.product}` : `Status: ${order.status}`}
          </Text>
          <Text className="text-sm text-[#876d64]">{order.total || order.price}</Text>
        </View>
      </View>

      {order.progress !== undefined && (
        <View className="items-center gap-2">
          <View className="w-[88px] h-1 bg-[#e5dedc] rounded-sm overflow-hidden">
            <View
              className="h-1 bg-[#171311]"
              style={{ width: `${order.progress}%` }}
            />
          </View>
          <Text className="text-sm font-medium text-[#171311]">{order.progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
