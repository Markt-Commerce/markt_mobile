import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { getCart, updateCartItem, deleteCartItem, getCartSummary, checkoutCart } from "../../services/sections/cart";
import { Cart, CartItem, CartSummary, CheckoutRequest } from "../../models/cart";
import { useToast } from "../../components/ToastProvider";

export default function CartScreen() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { show } = useToast();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await getCart();
      const summaryData = await getCartSummary();
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
    }
  };

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) {
      // remove item
      await deleteCartItem(item.id);
    } else {
      await updateCartItem(item.id, { quantity: newQty });
    }
    fetchCart(); // refresh after update
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const checkoutData: CheckoutRequest = {
        billing_address: {}, // fill in if you have address flow
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

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#e26136" />
        <Text className="mt-2 text-[#171311]">Loading cart...</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-[#171311] text-lg font-bold">Your cart is empty</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="flex-1 text-center text-lg font-bold text-[#171311]">Cart</Text>
      </View>

      {/* Cart Items */}
      {cart.items.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between gap-4 px-4 py-2 min-h-[72px]">
          <View className="flex-row items-center gap-4">
            <Image
              source={{ uri: item.product?.images?.[0]?.media?.original_url ?? "" }}
              className="w-14 h-14 rounded-lg bg-gray-200"
            />
            <View>
              {/* slicing the name incase it is longer than the screen size can contain */}
              <Text className="text-[#171311] text-base font-medium">{item.product?.name.slice(0,20)}</Text>
              <Text className="text-[#876d64] text-sm">Variant #{item.variant_id}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => handleQuantityChange(item, item.quantity - 1)}
              className="w-7 h-7 items-center justify-center rounded-full bg-[#f4f1f0]"
            >
              <Text className="text-base font-medium text-[#171311]">-</Text>
            </TouchableOpacity>
            <Text className="w-4 text-center text-base font-medium text-[#171311]">{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => handleQuantityChange(item, item.quantity + 1)}
              className="w-7 h-7 items-center justify-center rounded-full bg-[#f4f1f0]"
            >
              <Text className="text-base font-medium text-[#171311]">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Order Summary */}
      <Text className="text-[#171311] text-lg font-bold px-4 pt-4 pb-2">Order Summary</Text>
      <View className="px-4">
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Subtotal</Text>
          <Text className="text-sm text-[#171311]">${summary?.subtotal ?? 0}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Discount</Text>
          <Text className="text-sm text-[#171311]">-${summary?.discount ?? 0}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm text-[#876d64]">Total</Text>
          <Text className="text-sm text-[#171311]">${summary?.total ?? 0}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={processing}
          className="bg-[#e26136] h-12 items-center justify-center rounded-full"
        >
          <Text className="text-white text-base font-bold tracking-[0.015em]">
            {processing ? "Processing..." : "Proceed to Checkout"}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="h-5 bg-white" />
    </ScrollView>
  );
}
