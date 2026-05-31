import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCart, updateCartItem, deleteCartItem, getCartSummary, checkoutCart } from "../../services/sections/cart";
import { Cart, CartItem, CartSummary, CheckoutRequest } from "../../models/cart";
import { ArrowLeft, Trash2, ShoppingCart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../components/ToastProvider";
import { createOrder } from "../../services/sections/orders";
import { useTheme } from "../../components/themeProvider";

export default function CartScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();

  //map
  const fetchCart = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const [cartData, summaryData] = await Promise.all([getCart(), getCartSummary()]);
      setCart(cartData);
      setSummary(summaryData);
    } catch (err) {
      show({
        variant: "error",
        title: "Error loading cart",
        message: "There was a problem fetching your cart. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const formatMoney = (n?: number | string) => {
    const v = typeof n === "string" ? Number(n) : n ?? 0;
    try {
      return Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);
    } catch {
      return `₦${(v || 0).toFixed(2)}`;
    }
  };

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    try {
      if (newQty <= 0) {
        await deleteCartItem(item.id);
      } else {
        await updateCartItem(item.id, { quantity: newQty });
      }
      fetchCart();
    } catch (e) {
      console.error("Update qty failed:", e);
    }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await deleteCartItem(item.id);
      fetchCart();
    } catch (e) {
      console.error("Remove item failed:", e);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const checkoutData: CheckoutRequest = {
        billing_address: {},
        shipping_address: {},
        notes: "Checkout from mobile app",
      };
      //await checkoutCart(checkoutData);
      const checkout = await checkoutCart(
        checkoutData
      );
      show({
        variant: "success",
        title: "Checkout successful",
        message: "Your order has been placed successfully.",
      });
      //proceed to payment section

      fetchCart(); // reset cart
      router.push(`/checkout/payment-method/${checkout.order_id}`);
    } catch (err) {
      show({
        variant: "error",
        title: "Checkout failed",
        message: "There was a problem during checkout. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ---------- States ----------
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        <Text className={`mt-3 font-geist font-medium ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Loading your cart…</Text>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <TouchableOpacity onPress={() => router.back()} className={`h-10 w-10 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
          <Text className={`flex-1 text-center text-xl font-geist font-bold pr-10 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className={`w-24 h-24 rounded items-center justify-center mb-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <ShoppingCart size={40} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1} />
          </View>
          <Text className={`text-2xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Your cart is empty</Text>
          <Text className={`mt-2 font-inter text-base text-center leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Explore the marketplace and add items you love.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center"
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start shopping"
          >
            <Text className="text-white font-geist font-bold">Start shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Main ----------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <TouchableOpacity onPress={() => router.back()} className={`h-10 w-10 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-center text-xl font-geist font-bold pr-10 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Cart</Text>
      </View>

      <ScrollView
        className="flex-1 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Items container */}
        <View className="px-6 mt-6">
          <View className={`rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            {cart.items?.map((item, idx) => {
              const image = item.product?.images?.[0]?.media?.original_url ?? "";
              const name = item.product?.name ?? "Product";
              const price =
                (item.product as any)?.price ??
                (item as any)?.unit_price ??
                0;
              const lineTotal = Number(price) * (item.quantity ?? 1);

              return (
                <View key={item.id} className={`px-4 py-5 ${idx !== cart.items?.length - 1 ? (isDark ? "border-b border-[#46464e]" : "border-b border-border") : ""}`}>
                  <View className="flex-row gap-4">
                    <Image source={{ uri: image }} className={`w-20 h-20 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
                    <View className="flex-1">
                      <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className={`font-inter text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                        Variant #{item.variant_id}
                      </Text>

                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className={`font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(price)}</Text>

                        {/* Stepper + remove */}
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item, item.quantity - 1)}
                            className={`w-8 h-8 rounded border items-center justify-center ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                            activeOpacity={0.8}
                          >
                            <Text className={`text-lg font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>−</Text>
                          </TouchableOpacity>

                          <View className="min-w-[32px] items-center justify-center">
                            <Text className={`font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{item.quantity}</Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item, item.quantity + 1)}
                            className="w-8 h-8 rounded bg-primary items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-lg font-bold text-white">+</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleRemove(item)}
                            className={`ml-2 w-8 h-8 rounded border items-center justify-center ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                            activeOpacity={0.8}
                          >
                            <Trash2 size={14} color={isDark ? "#f0f1f2" : "#000000"} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mt-3 flex-row justify-between">
                        <Text className={`text-xs font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Line total</Text>
                        <Text className={`text-xs font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                          {formatMoney(lineTotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary card */}
        <View className="px-6 mt-6">
          <View className={`rounded border p-6 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Text className={`text-lg font-geist font-bold mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Order Summary</Text>

            <View className="flex-row justify-between py-2">
              <Text className={`text-sm font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Subtotal</Text>
              <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(summary?.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm font-inter ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Discount</Text>
              <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>−{formatMoney(summary?.discount)}</Text>
            </View>
            <View className={`h-[1px] my-4 ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
            <View className="flex-row justify-between py-2">
              <Text className={`text-base font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Total</Text>
              <Text className={`text-lg font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatMoney(summary?.total)}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={processing}
              className={`mt-6 h-12 rounded items-center justify-center ${processing ? (isDark ? "bg-[#2f3132]" : "bg-surface") : "bg-primary"}`}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={processing ? "Processing" : "Proceed to checkout"}
            >
              <Text className={`text-base font-geist font-bold ${processing ? (isDark ? "text-[#c6c5cf]" : "text-tertiary") : "text-white"}`}>
                {processing ? "Processing…" : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
