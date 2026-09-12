import React from "react";
import DeliveryProgress from "../../components/orders/DeliveryProgress";
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
import { useTokens, tokensFor } from "../../theme/useTokens";
import { formatStatus } from "../../utils/formatStatus";
import OrderProgress from "../../components/OrderProgress";
import { formatDate, formatTime, parseServerDate } from "../../utils/datetime";

function formatOrderDate(dateString?: string): string {
  if (!dateString) return "";
  const date = parseServerDate(dateString);
  if (!date) return "";
  return `${formatDate(date, { withYear: true })} · ${formatTime(date)}`;
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
  const t = useTokens();
  const iconColor = t.textPrimary;
  const mutedColor = t.textSecondary;

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
        className="flex-1 items-center justify-center bg-surface-page"
      >
        <Text className={"text-text-primary"}>
          Loading order...
        </Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-surface-page"
      >
        <Text className={"text-text-primary"}>
          Order not found
        </Text>
      </SafeAreaView>
    );
  }

  const shippingAddressLine = formatShippingAddress(order.shipping_address);
  const recipientName = order.shipping_address?.recipient_name;
  const orderDate = formatOrderDate(order.created_at);

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <ScrollView className="px-6">
        {/* Header */}
        <View className="flex-row items-center py-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 h-10 w-10 rounded border items-center justify-center bg-surface-sunken border-border"
          >
            <ArrowLeft size={20} color={iconColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-text-primary"
            >
              Order #{order.order_number ?? order.id}
            </Text>
            {orderDate ? (
              <Text className="text-xs text-text-muted mt-0.5">{orderDate}</Text>
            ) : null}
          </View>
        </View>

        {/* Where the order is, as a journey rather than a word in a box.
            Chowdeck's checkout does this with a segmented bar; the same idea
            applies better here, where there are four steps and the buyer's real
            question is "what happens next". */}
        <OrderProgress status={order.status} />

        {/* Buyer */}
        {order.buyer?.buyername ? (
          <View
            className="mb-5 pt-5 border-t flex-row items-center gap-3 border-border"
          >
            <User size={18} color={mutedColor} />
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Buyer
              </Text>
              <Text className="text-base font-bold mt-1 text-text-primary">
                {order.buyer.buyername}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Shipping Address */}
        {shippingAddressLine ? (
          <View
            className="mb-5 pt-5 border-t border-border"
          >
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color={mutedColor} />
              <Text className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Shipping Address
              </Text>
            </View>
            {recipientName ? (
              <Text className="text-base font-bold mt-2 text-text-primary">
                {recipientName}
              </Text>
            ) : null}
            <Text className="text-sm mt-1 text-text-primary">
              {shippingAddressLine}
            </Text>
          </View>
        ) : null}

        {/* Payment & Notes */}
        {(order.payment_method || order.customer_note) ? (
          <View
            className="mb-5 pt-5 border-t border-border"
          >
            {order.payment_method ? (
              <View className="flex-row items-center gap-2 mb-3">
                <CreditCard size={16} color={mutedColor} />
                <Text className="text-sm capitalize text-text-primary">
                  {order.payment_method.replace(/_/g, " ")}
                </Text>
              </View>
            ) : null}
            {order.customer_note ? (
              <View className="flex-row items-start gap-2">
                <FileText size={16} color={mutedColor} style={{ marginTop: 2 }} />
                <Text className="text-sm flex-1 text-text-primary">
                  {order.customer_note}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Items */}
        <View
          className="mb-5 pt-5 border-t border-border"
        >
          <Text
            className="font-bold text-lg mb-4 text-text-primary"
          >
            Items
          </Text>
          {(order.items ?? []).length === 0 ? (
            <Text className="text-sm text-text-muted">No items on this order.</Text>
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
          className="mb-6 pt-5 border-t border-border"
        >
          <Text
            className="font-bold text-lg mb-4 text-text-primary"
          >
            Summary
          </Text>

          <Row label="Subtotal" value={order.subtotal} isDark={isDark} />
          <Row label="Shipping" value={order.shipping_fee} isDark={isDark} />
          <Row label="Tax" value={order.tax} isDark={isDark} />
          <Row label="Discount" value={order.discount} isDark={isDark} />

          <View
            className="h-px my-4 bg-border"
          />

          <Row label="Total" value={order.total} bold isDark={isDark} />
        </View>

        {/* Only when the order carries a delivery. Orders checked out before
            quoting existed have none, and an empty tracker is worse than no
            tracker. */}
        {order.delivery ? (
          <View className="mb-4">
            <DeliveryProgress delivery={order.delivery} />
          </View>
        ) : null}

        <View className="flex pb-10 gap-2.5">
          {order.status === "pending_payment" ? (
            <TouchableOpacity
              className="bg-primary-fill h-12 rounded-xl justify-center items-center"
              onPress={() => router.push(`/checkout/payment-method/${order.id}`)}
              accessibilityRole="button"
              accessibilityLabel="Pay for this order"
            >
              <Text className="text-white font-bold text-[15px]">Pay now</Text>
            </TouchableOpacity>
          ) : (
            // Only once there's something to track. On an unpaid order this
            // led to a tracking screen with nothing in it.
            <TouchableOpacity
              className="bg-primary-fill h-12 rounded-xl justify-center items-center flex-row"
              onPress={() => router.push(`/orders/${id}/track`)}
              accessibilityRole="button"
              accessibilityLabel="Track this order"
            >
              <Text className="text-white font-bold text-[15px] mr-1.5">
                Track order
              </Text>
              <ArrowRight size={18} color={t.textOnPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
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
    <View className={`pb-3 mb-3 ${isLast ? "" : `border-b border-border`}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-row flex-1 pr-2 gap-3">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-12 h-12 rounded bg-media" />
          ) : (
            <View className="w-12 h-12 rounded items-center justify-center bg-media">
              <Package size={18} color={tokensFor(isDark).textSecondary} />
            </View>
          )}
          <View className="flex-1">
            <Text
              className="text-base font-bold text-text-primary"
            >
              {name}
            </Text>
            {item.variant_id ? (
              <Text className="text-xs text-text-muted mt-0.5">Variant #{item.variant_id}</Text>
            ) : null}
            <Text className="text-xs text-text-muted mt-1 capitalize">
              Qty: {item.quantity} · {formatStatus(item.status)}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-sm font-bold text-text-primary">
            ₦{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-xs text-text-muted mt-0.5">
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
        className={`text-sm ${bold ? `font-bold text-text-primary` : "text-text-muted"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? "font-bold" : ""} text-text-primary`}
      >
        ₦{(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}
