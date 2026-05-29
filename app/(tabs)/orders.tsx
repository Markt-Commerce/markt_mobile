/**
 * Orders — Unified cart + orders (Chowdeck-style)
 *
 * Tabs: My Cart | Ongoing | Completed (buyer)
 *       Seller orders (seller mode)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, RefreshCw, Info, ShoppingCart } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  getCartSummary,
  checkoutCart,
} from "../../services/sections/cart";
import { getBuyerOrders, getSellerOrders } from "../../services/sections/orders";
import { Cart, CartItem, CartSummary, CheckoutRequest } from "../../models/cart";
import type { Order, SellerOrderItem } from "../../models/orders";
import { useToast } from "../../components/ToastProvider";
import OrdersList from "../../components/orderList";
import { useTheme } from "../../components/themeProvider";

type TabId = "cart" | "ongoing" | "completed";

const formatMoney = (n?: number | string) => {
  const v = typeof n === "string" ? Number(n) : n ?? 0;
  try {
    return Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `₦${(v || 0).toFixed(0)}`;
  }
};

function MyCartTab() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const [cartData, summaryData] = await Promise.all([getCart(), getCartSummary()]);
      setCart(cartData);
      setSummary(summaryData);
    } catch {
      show({
        variant: "error",
        title: "Error loading cart",
        message: "Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    try {
      if (newQty <= 0) await deleteCartItem(item.id);
      else await updateCartItem(item.id, { quantity: newQty });
      fetchCart();
    } catch { }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await deleteCartItem(item.id);
      fetchCart();
    } catch { }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const checkoutData: CheckoutRequest = {
        billing_address: {},
        shipping_address: {},
        notes: "Checkout from mobile",
      };
      const checkout = await checkoutCart(checkoutData);
      show({
        variant: "success",
        title: "Checkout successful",
        message: "Proceeding to payment.",
      });
      fetchCart();
      router.push(`/checkout/payment-method/${checkout.order_id}`);
    } catch {
      show({
        variant: "error",
        title: "Checkout failed",
        message: "Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
      </View>
    );
  }

  if (!cart || !cart.items?.length) {
    return (
        <View className="flex-1 items-center justify-center px-6 py-16" >
          <View className={`w-24 h-24 rounded items-center justify-center mb-4 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <ShoppingCart size={36} color={isDark ? "#f0f1f2" : "#000000"} />
          </View>
        <Text className={`text-xl font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Your cart is empty</Text>
        <Text className={`mt-2 text-sm text-center ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          Add items from the feed to get started.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 h-12 px-6 rounded bg-primary items-center justify-center"
        >
          <Text className="text-white font-semibold">Start shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCart(); }} tintColor={isDark ? "#f0f1f2" : "#000000"} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-4">
        <View className={`rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          {cart.items.map((item, idx) => {
            const image = item.product?.images?.[0]?.media?.original_url ?? "";
            const name = item.product?.name ?? "Product";
            const price = (item.product as any)?.price ?? (item as any)?.unit_price ?? 0;
            const lineTotal = Number(price) * (item.quantity ?? 1);
            return (
              <View
                key={item.id}
                className={`px-4 py-3 ${idx !== cart.items!.length - 1 ? (isDark ? "border-b border-[#46464e]" : "border-b border-border") : ""}`}
              >
                <View className="flex-row gap-3">
                  <Image source={{ uri: image }} className={`w-16 h-16 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>{name}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className={`font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(price)}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity - 1)}
                          className={`w-8 h-8 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                        >
                          <Text className={`text-base font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>−</Text>
                        </TouchableOpacity>
                        <View className={`min-w-[36px] h-8 rounded border items-center justify-center px-2 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-bg-elevated border-border"}`}>
                          <Text className={`font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{item.quantity}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-primary items-center justify-center"
                        >
                          <Text className="text-base font-bold text-white">+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemove(item)}
                          className={`ml-1 w-8 h-8 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                        >
                          <Trash2 size={16} color={isDark ? "#f0f1f2" : "#000000"} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="mt-2 flex-row justify-between">
                      <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Line total</Text>
                      <Text className={`text-xs font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(lineTotal)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-4 mt-4">
        <View className={`rounded border p-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <Text className={`text-base font-extrabold mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Order Summary</Text>
          <View className="flex-row justify-between py-1.5">
            <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Subtotal</Text>
            <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(summary?.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Discount</Text>
            <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>−{formatMoney(summary?.discount)}</Text>
          </View>
          <View className={`h-px my-2 ${isDark ? "bg-[#46464e]" : "bg-border-light"}`} />
          <View className="flex-row justify-between py-1.5">
            <Text className={`text-sm font-semibold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Total</Text>
            <Text className={`text-sm font-extrabold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(summary?.total)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={processing}
            className={`mt-4 h-12 rounded items-center justify-center ${processing ? (isDark ? "bg-[#2f3132]" : "bg-surface") : "bg-primary"}`}
          >
            <Text className={processing ? (isDark ? "text-[#c6c5cf]" : "text-tertiary") : "text-white font-semibold"}>
              {processing ? "Processing…" : "Proceed to Checkout"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function BuyerOrdersTabs({
  activeTab,
  onOrderPress,
  isDark,
}: {
  activeTab: "ongoing" | "completed";
  onOrderPress: (order: Order) => void;
  isDark: boolean;
}) {
  const fetchOrders = useCallback(
    async (page: number) => {
      const data = await getBuyerOrders(page, 10);
      const ongoingStatuses = ["pending_payment", "confirmed", "processing", "shipped"];
      if (activeTab === "ongoing") {
        return data.filter((o) => ongoingStatuses.includes((o.status ?? "").toLowerCase()));
      }
      return data.filter((o) => ["delivered", "completed"].includes((o.status ?? "").toLowerCase()));
    },
    [activeTab]
  );

  return (
    <View className="flex-1 px-4 pt-2">
      <View className={`flex-1 rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <OrdersList
          key={activeTab}
          fetchOrders={fetchOrders}
          pressed={onOrderPress}
        />
      </View>
    </View>
  );
}

function SellerOrdersTab({ isDark }: { isDark: boolean }) {
  const router = useRouter();

  const fetchOrders = useCallback(async (page: number) => {
    const res = await getSellerOrders(page, 10);
    return res.items;
  }, []);

  return (
    <View className="flex-1 px-4 pt-2">
      <View className={`flex-1 rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <OrdersList
          fetchOrders={fetchOrders}
          isSeller
          pressed={(item: SellerOrderItem) => {
            if (item.order_id) router.push(`/orderdetail/${item.order_id}` as any);
          }}
        />
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeTab, setActiveTab] = useState<TabId>(role === "buyer" ? "cart" : "ongoing");

  const tabs =
    role === "buyer"
      ? [
        { id: "cart" as const, label: "My Cart" },
        { id: "ongoing" as const, label: "Ongoing" },
        { id: "completed" as const, label: "Completed" },
      ]
      : [{ id: "ongoing" as const, label: "Orders" }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "#F4F4F5" }} edges={["left", "right", "bottom"]}>
      <View className={`border-b px-4 pt-4 pb-2 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <View className=" mb-3">
          <Text className={`text-xl font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Orders</Text>
          <View className="w-10" />
        </View>

        {/* Segmented control (Chowdeck-style) */}
        <View className={`flex-row rounded p-1 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded items-center ${activeTab === t.id ? (isDark ? "bg-[#1a1c1d]" : "bg-white") : ""}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === t.id ? (isDark ? "text-[#f0f1f2]" : "text-black") : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {role === "buyer" && activeTab === "cart" && <MyCartTab />}
      {role === "buyer" && activeTab === "ongoing" && (
        <BuyerOrdersTabs
          activeTab="ongoing"
          onOrderPress={(o) => router.push(`/orderdetail/${o.id}` as any)}
          isDark={isDark}
        />
      )}
      {role === "buyer" && activeTab === "completed" && (
        <BuyerOrdersTabs
          activeTab="completed"
          onOrderPress={(o) => router.push(`/orderdetail/${o.id}` as any)}
          isDark={isDark}
        />
      )}
      {role === "seller" && <SellerOrdersTab isDark={isDark} />}
    </SafeAreaView>
  );
}
