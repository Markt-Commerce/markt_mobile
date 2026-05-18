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
import { ArrowLeft, Trash2, RefreshCw, Info } from "lucide-react-native";
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
    } catch {}
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await deleteCartItem(item.id);
      fetchCart();
    } catch {}
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
        <ActivityIndicator size="large" color="#e26136" />
      </View>
    );
  }

  if (!cart || !cart.items?.length) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <View className="w-24 h-24 rounded-2xl bg-bg-muted items-center justify-center mb-4">
          <Text className="text-4xl">🛒</Text>
        </View>
        <Text className="text-text-primary text-xl font-bold">Your cart is empty</Text>
        <Text className="mt-2 text-text-secondary text-sm text-center">
          Add items from the feed to get started.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 h-12 px-6 rounded-full bg-primary items-center justify-center"
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
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCart(); }} tintColor="#e26136" />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-4">
        <View className="rounded-2xl bg-white border border-border overflow-hidden">
          {cart.items.map((item, idx) => {
            const image = item.product?.images?.[0]?.media?.original_url ?? "";
            const name = item.product?.name ?? "Product";
            const price = (item.product as any)?.price ?? (item as any)?.unit_price ?? 0;
            const lineTotal = Number(price) * (item.quantity ?? 1);
            return (
              <View
                key={item.id}
                className={`px-4 py-3 ${idx !== cart.items!.length - 1 ? "border-b border-border-light" : ""}`}
              >
                <View className="flex-row gap-3">
                  <Image source={{ uri: image }} className="w-16 h-16 rounded-xl bg-bg-muted" />
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold" numberOfLines={1}>{name}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-text-primary font-semibold">{formatMoney(price)}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-bg-muted items-center justify-center"
                        >
                          <Text className="text-base font-bold text-text-primary">−</Text>
                        </TouchableOpacity>
                        <View className="min-w-[36px] h-8 rounded-full bg-bg-elevated border border-border items-center justify-center px-2">
                          <Text className="text-text-primary font-semibold">{item.quantity}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                        >
                          <Text className="text-base font-bold text-white">+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemove(item)}
                          className="ml-1 w-8 h-8 rounded-full bg-bg-muted items-center justify-center"
                        >
                          <Trash2 size={16} color="#171311" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="mt-2 flex-row justify-between">
                      <Text className="text-xs text-text-secondary">Line total</Text>
                      <Text className="text-xs font-semibold text-text-primary">{formatMoney(lineTotal)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-4 mt-4">
        <View className="rounded-2xl bg-white border border-border p-4">
          <Text className="text-text-primary text-base font-extrabold mb-2">Order Summary</Text>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-text-secondary">Subtotal</Text>
            <Text className="text-sm text-text-primary">{formatMoney(summary?.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-text-secondary">Discount</Text>
            <Text className="text-sm text-text-primary">−{formatMoney(summary?.discount)}</Text>
          </View>
          <View className="h-px bg-border-light my-2" />
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm font-semibold text-text-primary">Total</Text>
            <Text className="text-sm font-extrabold text-text-primary">{formatMoney(summary?.total)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={processing}
            className={`mt-4 h-12 rounded-button items-center justify-center ${processing ? "bg-bg-muted" : "bg-primary"}`}
          >
            <Text className={processing ? "text-text-secondary" : "text-white font-semibold"}>
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
}: {
  activeTab: "ongoing" | "completed";
  onOrderPress: (order: Order) => void;
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
      <View className="flex-1 rounded-2xl bg-white border border-border overflow-hidden">
        <OrdersList
          key={activeTab}
          fetchOrders={fetchOrders}
          pressed={onOrderPress}
        />
      </View>
    </View>
  );
}

function SellerOrdersTab() {
  const router = useRouter();

  const fetchOrders = useCallback(async (page: number) => {
    const res = await getSellerOrders(page, 10);
    return res.items;
  }, []);

  return (
    <View className="flex-1 px-4 pt-2">
      <View className="flex-1 rounded-2xl bg-white border border-border overflow-hidden">
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
    <SafeAreaView className="flex-1 bg-bg-elevated">
      <View className="bg-white border-b border-border px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 rounded-full bg-bg-muted items-center justify-center">
            <ArrowLeft size={18} color="#171311" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Orders</Text>
          <View className="w-10" />
        </View>

        {/* Segmented control (Chowdeck-style) */}
        <View className="flex-row rounded-xl bg-bg-muted p-1">
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === t.id ? "bg-text-primary" : ""}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === t.id ? "text-white" : "text-text-secondary"}`}>
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
        />
      )}
      {role === "buyer" && activeTab === "completed" && (
        <BuyerOrdersTabs
          activeTab="completed"
          onOrderPress={(o) => router.push(`/orderdetail/${o.id}` as any)}
        />
      )}
      {role === "seller" && <SellerOrdersTab />}
    </SafeAreaView>
  );
}
