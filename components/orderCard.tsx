// ...existing code...
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Order, OrderItem, SellerOrderItem } from "../models/orders";

interface OrderCardProps {
  order: Order | OrderItem | SellerOrderItem | any;
  onPress?: () => void;
  isSeller?: boolean;
}

function isSellerOrderItem(o: any): o is SellerOrderItem {
  return !!o && typeof o === "object" && ("order" in o || "order_id" in o) && ("price" in o) && ("product" in o);
}

function isOrder(o: any): o is Order {
  return !!o && typeof o === "object" && ("order_number" in o || "items" in o || "cart_id" in o);
}

function isOrderItem(o: any): o is OrderItem {
  return !!o && typeof o === "object" && ("product_id" in o || ("price" in o && "quantity" in o && !isSellerOrderItem(o)));
}

export default function OrderCard({ order, onPress, isSeller }: OrderCardProps) {
  // Safe extraction with fallbacks
  let title = "Order";
  let subtitle = "";
  let priceText = "";
  let imageUri: string | undefined = undefined;
  let progress: number | undefined = undefined;

  if (isSellerOrderItem(order)) {
    // SellerOrderItem
    title = order.product?.name ?? `Item ${order.id ?? ""}`;
    subtitle = `Order #: ${order.order?.order_number ?? order.order_id ?? ""}`;
    priceText = typeof order.price !== "undefined" ? `$${order.price}` : "";
    //imageUri = order.product?.image ?? undefined;
  } else if (isOrder(order)) {
    // Order (buyer)
    const firstItem = Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : undefined;
    title = firstItem?.product?.name ?? `Order ${order.order_number ?? order.id ?? ""}`;
    subtitle = `Status: ${order.status ?? "unknown"}`;
    // Prefer total, then subtotal, then compute
    const val = order.total ?? order.subtotal ?? 0;
    priceText = typeof val === "number" ? `$${val}` : String(val ?? "");
    //imageUri = firstItem?.product?.image ?? undefined;
  } else if (isOrderItem(order)) {
    // OrderItem (could be used in some contexts)
    title = order.product?.name ?? `Item ${order.product_id ?? ""}`;
    subtitle = `Qty: ${order.quantity ?? 0} • Status: ${order.status ?? ""}`;
    priceText = typeof order.price !== "undefined" ? `$${order.price}` : "";
    
  } else {
    // Unknown shape - defensive defaults
    title = order?.title ?? order?.name ?? `Order ${order?.id ?? ""}`;
    subtitle = order?.subtitle ?? order?.status ?? "";
    priceText = order?.total ? String(order.total) : order?.price ? String(order.price) : "";
    progress = typeof order?.progress === "number" ? order.progress : undefined;
  }

  // If the parent provided isSeller prop, swap title/subtitle to show buyer info
  if (isSeller && isOrder(order)) {
    // show buyer for seller when an Order object is passed mistakenly
    const buyerName = order.buyer?.buyername ?? order.buyer?.buyername;
    if (buyerName) subtitle = `From: ${buyerName}`;
  }

  return (
    <TouchableOpacity
      className="flex-row justify-between gap-4 bg-white px-4 py-3 border-b border-[#eee]"
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View className="flex-row gap-4 flex-1">
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-[70px] aspect-[3/4] rounded-lg" />
        ) : (
          <View className="w-[70px] aspect-[3/4] rounded-lg bg-[#f4f1f0] items-center justify-center">
            <Text className="text-xs text-[#876d64]">No image</Text>
          </View>
        )}

        <View className="flex-1 justify-center">
          <Text className="text-base font-medium text-[#171311]">
            {isSeller && isSellerOrderItem(order) ? `From: ${order.order?.buyer?.buyername ?? "Buyer"}` : title}
          </Text>
          <Text className="text-sm text-[#876d64]">
            {isSeller && isSellerOrderItem(order)
              ? `Product: ${order.product?.name ?? title}`
              : subtitle}
          </Text>
          <Text className="text-sm text-[#876d64]">{priceText}</Text>
        </View>
      </View>

      {typeof progress === "number" && (
        <View className="items-center gap-2">
          <View className="w-[88px] h-1 bg-[#e5dedc] rounded-sm overflow-hidden">
            <View
              className="h-1 bg-[#171311]"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </View>
          <Text className="text-sm font-medium text-[#171311]">{Math.round(progress)}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
