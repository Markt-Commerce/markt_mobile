import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  getCartSummary,
  checkoutCart,
} from "../../services/sections/cart";
import { Cart, CartItem, CartSummary, CheckoutRequest } from "../../models/cart";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../components/ToastProvider";

export default function CartScreen() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { show } = useToast();

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
      return `$${(v || 0).toFixed(2)}`;
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
      await checkoutCart(checkoutData);
      show({
        variant: "success",
        title: "Checkout successful",
        message: "Your order has been placed successfully.",
      });
      fetchCart(); // reset cart
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#e26136" />
        <Text className="mt-3 text-[#171311] font-medium">Loading your cart…</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 rounded-full items-center justify-center bg-[#f4f1f0]">
            <ArrowLeft size={18} color="#171311" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-extrabold text-[#171311] -ml-10">Cart</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 rounded-2xl bg-[#f7f4f3] mb-4" />
          <Text className="text-[#171311] text-xl font-extrabold">Your cart is empty</Text>
          <Text className="mt-2 text-[#876d64] text-sm text-center">
            Explore the marketplace and add items you love.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mt-6 h-11 px-6 rounded-full bg-[#171311] items-center justify-center"
          >
            <Text className="text-white font-semibold">Start shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- Main ----------
  return (
    <View className="flex-1 bg-[#faf9f8]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 rounded-full items-center justify-center bg-white border border-[#efe9e7]">
          <ArrowLeft size={18} color="#171311" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-extrabold text-[#171311] -ml-10">Cart</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e26136" />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Items container */}
        <View className="px-4">
          <View className="rounded-2xl bg-white border border-[#efe9e7] overflow-hidden">
            {cart.items.map((item, idx) => {
              const image = item.product?.images?.[0]?.media?.original_url ?? "";
              const name = item.product?.name ?? "Product";
              const price =
                (item.product as any)?.price ??
                (item as any)?.unit_price ??
                0;
              const lineTotal = Number(price) * (item.quantity ?? 1);

              return (
                <View key={item.id} className={`px-4 py-3 ${idx !== cart.items.length - 1 ? "border-b border-[#f3efed]" : ""}`}>
                  <View className="flex-row gap-3">
                    <Image source={{ uri: image }} className="w-16 h-16 rounded-xl bg-[#f4f1f0]" />
                    <View className="flex-1">
                      <Text className="text-[#171311] font-semibold" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-[#876d64] text-xs mt-0.5">
                        Variant #{item.variant_id}
                      </Text>

                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="text-[#171311] font-semibold">{formatMoney(price)}</Text>

                        {/* Stepper + remove */}
                        <View className="flex-row items-center gap-1.5">
                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-[#f4f1f0] items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-base font-bold text-[#171311]">−</Text>
                          </TouchableOpacity>

                          <View className="min-w-[36px] h-8 rounded-full bg-[#faf7f6] border border-[#efe9e7] items-center justify-center px-2">
                            <Text className="text-[#171311] font-semibold">{item.quantity}</Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-[#171311] items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Text className="text-base font-bold text-white">+</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleRemove(item)}
                            className="ml-1 w-8 h-8 rounded-full bg-[#f4f1f0] items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Trash2 size={16} color="#171311" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mt-2 flex-row justify-between">
                        <Text className="text-xs text-[#8e7a74]">Line total</Text>
                        <Text className="text-xs font-semibold text-[#171311]">
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
        <View className="px-4 mt-4">
          <View className="rounded-2xl bg-white border border-[#efe9e7] p-4">
            <Text className="text-[#171311] text-base font-extrabold mb-2">Order Summary</Text>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-[#876d64]">Subtotal</Text>
              <Text className="text-sm text-[#171311]">{formatMoney(summary?.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-[#876d64]">Discount</Text>
              <Text className="text-sm text-[#171311]">−{formatMoney(summary?.discount)}</Text>
            </View>
            <View className="h-[1px] bg-[#f3efed] my-2" />
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm font-semibold text-[#171311]">Total</Text>
              <Text className="text-sm font-extrabold text-[#171311]">{formatMoney(summary?.total)}</Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={processing}
              className="mt-4 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: processing ? "#e9d6d1" : "#e26136" }}
              activeOpacity={0.9}
            >
              <Text className="text-white text-base font-bold tracking-[0.015em]">
                {processing ? "Processing..." : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
