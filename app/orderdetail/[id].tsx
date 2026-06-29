import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, CreditCard, FileText, User, Package } from "lucide-react-native";
import { getOrderDetails } from "../../services/sections/orders";
import { getProductById } from "../../services/sections/product";
import { Order, OrderItem } from "../../models/orders";
import type { ProductDetail } from "../../models/products";
import { useTheme } from "../../components/themeProvider";

function formatOrderDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " · " +
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatShippingAddress(addr?: Record<string, any>): string {
  if (!addr) return "";
  const parts = [
    addr.street_address ?? addr.street,
    addr.city,
    addr.state,
    addr.country,
  ].filter((v) => typeof v === "string" && v.trim().length > 0);
  if (parts.length > 0) return parts.join(", ");
  if (typeof addr.latitude === "number" && typeof addr.longitude === "number") {
    return `${addr.latitude.toFixed(5)}, ${addr.longitude.toFixed(5)}`;
  }
  return "";
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // Order items only carry product_id/price/quantity/status (see temp.txt) — no
  // product name or image — so we resolve each item's product separately.
  const [productsById, setProductsById] = useState<Record<string, ProductDetail>>({});
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f5f5f5" : "#000000";
  const mutedColor = isDark ? "#c6c5cf" : "#71717A";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(id);
        setOrder(data);

        const ids = Array.from(new Set((data.items ?? []).map((i) => i.product_id).filter(Boolean)));
        const results = await Promise.all(
          ids.map((pid) => getProductById(pid).catch(() => null))
        );
        const map: Record<string, ProductDetail> = {};
        results.forEach((product, idx) => {
          if (product) map[ids[idx]] = product;
        });
        setProductsById(map);
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

  const shippingAddressLine = formatShippingAddress(order.shipping_address);
  const recipientName = order.shipping_address?.recipient_name;
  const orderDate = formatOrderDate(order.created_at);

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
          <View className="flex-1">
            <Text
              className={`text-xl font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              Order #{order.order_number ?? order.id}
            </Text>
            {orderDate ? (
              <Text className="text-xs font-inter text-tertiary mt-0.5">{orderDate}</Text>
            ) : null}
          </View>
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

        {/* Buyer */}
        {order.buyer?.buyername ? (
          <View
            className={`rounded border p-6 mb-6 flex-row items-center gap-3 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          >
            <User size={18} color={mutedColor} />
            <View>
              <Text className="text-xs font-geist font-bold uppercase tracking-wider text-tertiary">
                Buyer
              </Text>
              <Text className={`text-base font-geist font-bold mt-1 ${isDark ? "text-dark-text" : "text-black"}`}>
                {order.buyer.buyername}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Shipping Address */}
        {shippingAddressLine ? (
          <View
            className={`rounded border p-6 mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          >
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color={mutedColor} />
              <Text className="text-xs font-geist font-bold uppercase tracking-wider text-tertiary">
                Shipping Address
              </Text>
            </View>
            {recipientName ? (
              <Text className={`text-base font-geist font-bold mt-2 ${isDark ? "text-dark-text" : "text-black"}`}>
                {recipientName}
              </Text>
            ) : null}
            <Text className={`text-sm font-inter mt-1 ${isDark ? "text-dark-text" : "text-black"}`}>
              {shippingAddressLine}
            </Text>
          </View>
        ) : null}

        {/* Payment & Notes */}
        {(order.payment_method || order.customer_note) ? (
          <View
            className={`rounded border p-6 mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          >
            {order.payment_method ? (
              <View className="flex-row items-center gap-2 mb-3">
                <CreditCard size={16} color={mutedColor} />
                <Text className={`text-sm font-inter capitalize ${isDark ? "text-dark-text" : "text-black"}`}>
                  {order.payment_method.replace(/_/g, " ")}
                </Text>
              </View>
            ) : null}
            {order.customer_note ? (
              <View className="flex-row items-start gap-2">
                <FileText size={16} color={mutedColor} style={{ marginTop: 2 }} />
                <Text className={`text-sm font-inter flex-1 ${isDark ? "text-dark-text" : "text-black"}`}>
                  {order.customer_note}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Items */}
        <View
          className={`rounded border p-6 mb-6 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
        >
          <Text
            className={`font-geist font-bold text-lg mb-4 ${isDark ? "text-dark-text" : "text-black"}`}
          >
            Items
          </Text>
          {(order.items ?? []).length === 0 ? (
            <Text className="text-sm font-inter text-tertiary">No items on this order.</Text>
          ) : (
            order.items!.map((item, index) => (
              <ItemRow
                key={`${item.product_id}-${item.variant_id ?? index}`}
                item={item}
                product={productsById[item.product_id]}
                isLast={index === order.items!.length - 1}
                isDark={isDark}
              />
            ))
          )}
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

        <View className="flex pb-10 gap-3">
          {order.status === "pending_payment" ? (
            <TouchableOpacity
              className="bg-primary h-12 rounded justify-center items-center"
              onPress={() => router.push(`/checkout/payment-method/${order.id}`)}
            >
              <Text className="text-white font-geist font-bold text-base">
                Pay now
              </Text>
            </TouchableOpacity>
          ) : null}
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

function ItemRow({
  item,
  product,
  isLast,
  isDark,
}: {
  item: OrderItem;
  product?: ProductDetail;
  isLast: boolean;
  isDark: boolean;
}) {
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 1);
  const imageUrl = product?.images?.[0]?.media?.original_url;
  const name = product?.name ?? item.product?.name ?? `Product ${item.product_id}`;

  return (
    <View className={`pb-3 mb-3 ${isLast ? "" : `border-b ${isDark ? "border-dark-border" : "border-border"}`}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-row flex-1 pr-2 gap-3">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className={`w-12 h-12 rounded ${isDark ? "bg-dark-elevated" : "bg-surface"}`} />
          ) : (
            <View className={`w-12 h-12 rounded items-center justify-center ${isDark ? "bg-dark-elevated" : "bg-surface"}`}>
              <Package size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
            </View>
          )}
          <View className="flex-1">
            <Text
              className={`text-base font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
            >
              {name}
            </Text>
            {item.variant_id ? (
              <Text className="text-xs font-inter text-tertiary mt-0.5">Variant #{item.variant_id}</Text>
            ) : null}
            <Text className="text-xs font-inter text-tertiary mt-1 capitalize">
              Qty: {item.quantity} · {item.status}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`text-sm font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}>
            ₦{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-xs font-inter text-tertiary mt-0.5">
            ₦{(item.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} each
          </Text>
        </View>
      </View>
    </View>
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
