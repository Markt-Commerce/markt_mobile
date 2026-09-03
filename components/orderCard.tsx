import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Image as ImageIcon } from "lucide-react-native";
import { Order, OrderItem, SellerOrderItem } from "../models/orders";
import { useTheme } from "./themeProvider";
import { formatNaira } from "../utils/formatCurrency";
import { formatStatus, statusTone } from "../utils/formatStatus";

/** Tone -> [light, dark] class pairs. Colour carries the state so the row can
 *  be scanned without reading the word. */
const TONE_BG: Record<string, [string, string]> = {
  positive: ["bg-[#E7F6EC]", "bg-[#1E3A28]"],
  attention: ["bg-[#FEF3E2]", "bg-[#3A2E18]"],
  negative: ["bg-[#FDECEC]", "bg-[#3A1E1E]"],
  neutral: ["bg-[#F4F4F5]", "bg-[#2f3132]"],
};
const TONE_TEXT: Record<string, [string, string]> = {
  positive: ["text-[#0F7B3F]", "text-[#7BD9A2]"],
  attention: ["text-[#A15C00]", "text-[#F0B667]"],
  negative: ["text-[#C42B2B]", "text-[#F09A9A]"],
  neutral: ["text-[#52525B]", "text-[#c6c5cf]"],
};

interface OrderCardProps {
  order: Order | OrderItem | SellerOrderItem | any;
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

export default function OrderCard({ order, isSeller }: OrderCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Safe extraction with fallbacks
  let title = "Order";
  let subtitle = "";
  let priceText = "";
  let imageUri: string | undefined = undefined;
  let statusText = "";
  const rawStatus: string = (order as any)?.status ?? "";
  let progress: number | undefined = undefined;

  if (isSellerOrderItem(order)) {
    // SellerOrderItem
    title = order.product?.name ?? `Item ${order.id ?? ""}`;
    subtitle = `Order #: ${order.order?.order_number ?? order.order_id ?? ""}`;
    priceText = typeof order.price !== "undefined" ? formatNaira(order.price) : "";
    imageUri = order.product?.image_url ?? undefined;
    statusText = formatStatus(order.status);
  } else if (isOrder(order)) {
    // Order (buyer)
    const firstItem = Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : undefined;
    title = firstItem?.product?.name ?? `Order ${order.order_number ?? order.id ?? ""}`;
    subtitle = firstItem?.product?.name ? "" : "";
    // Prefer total, then subtotal, then compute
    const val = order.total ?? order.subtotal ?? 0;
    priceText = typeof val === "number" ? formatNaira(val) : String(val ?? "");
    imageUri = firstItem?.product?.image_url ?? undefined;
    statusText = formatStatus(order.status);
  } else if (isOrderItem(order)) {
    // OrderItem (could be used in some contexts)
    title = order.product?.name ?? `Item ${order.product_id ?? ""}`;
    subtitle = `Qty: ${order.quantity ?? 0}`;
    statusText = formatStatus(order.status);
    imageUri = order.product?.image_url ?? undefined;
    priceText = typeof order.price !== "undefined" ? formatNaira(order.price) : "";

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
    <View
      className={`flex-row justify-between gap-4 px-4 py-3 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
    >
      <View className="flex-row gap-4 flex-1">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className={`w-14 h-14 rounded-lg ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
          />
        ) : (
          // A neutral tile, not the words "No image". Every row said that,
          // because imageUri was never assigned -- and even once it is, a
          // missing thumbnail is not worth a sentence.
          <View className={`w-14 h-14 rounded-lg items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <ImageIcon size={18} color={isDark ? "#6b6d71" : "#C4C4C8"} strokeWidth={1.8} />
          </View>
        )}

        <View className="flex-1 justify-center">
          <Text className={`text-base font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {isSeller && isSellerOrderItem(order) ? `From: ${order.order?.buyer?.buyername ?? "Buyer"}` : title}
          </Text>
          <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {isSeller && isSellerOrderItem(order)
              ? `Product: ${order.product?.name ?? title}`
              : subtitle}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className={`text-sm font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              {priceText}
            </Text>
            {statusText ? (
              <View className={`ml-2 px-2 py-0.5 rounded-full ${TONE_BG[statusTone(rawStatus)][isDark ? 1 : 0]}`}>
                <Text className={`text-[11px] font-semibold ${TONE_TEXT[statusTone(rawStatus)][isDark ? 1 : 0]}`}>
                  {statusText}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {typeof progress === "number" && (
        <View className="items-center gap-2">
          <View className={`w-[88px] h-1 rounded overflow-hidden ${isDark ? "bg-[#46464e]" : "bg-border"}`}>
            <View
              className="h-1 bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </View>
          <Text className={`text-sm font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
}
