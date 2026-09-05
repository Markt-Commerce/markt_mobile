import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCart, updateCartItem, deleteCartItem, getCartSummary } from "../../services/sections/cart";
import { initializeCheckoutPayment } from "../../services/sections/payments";
import { buildCheckoutPaymentInitRequest } from "../../utils/checkoutPayload";
import { clearIdempotencyKey } from "../../utils/idempotency";
import { Cart, CartItem, CartSummary } from "../../models/cart";
import { FulfilmentPreference } from "../../models/payments";
import { ArrowLeft, Trash2, ShoppingCart, Check } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useToast } from "../../components/ToastProvider";
import { useTheme } from "../../components/themeProvider";
import { useShippingAddress } from "../../hooks/useShippingAddress";
import {
  isShippingAddressUsable,
  missingShippingFields,
} from "../../utils/shippingAddress";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import ShippingAddressCard from "../../components/shippingAddressCard";
import logger from "../../utils/logger";

export default function CartScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fulfilmentPreference, setFulfilmentPreference] =
    useState<FulfilmentPreference>("auto");
  const [reliabilityFeeOptedIn, setReliabilityFeeOptedIn] = useState(false);
  const { show } = useToast();
  const shipping = useShippingAddress();

  //map
  const fetchCart = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
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
  }, []);

  // Re-check the backend every time the Cart tab gains focus, not just on first mount
  useFocusEffect(
    useCallback(() => {
      fetchCart({ silent: true });
    }, [fetchCart])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart({ silent: true });
  };

  const formatMoney = (n?: number | string) => {
    const v = typeof n === "string" ? Number(n) : n ?? 0;
    try {
      return Intl.NumberFormat(undefined, { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(v);
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
      logger.error("Update qty failed:", e);
    }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await deleteCartItem(item.id);
      fetchCart();
    } catch (e) {
      logger.error("Remove item failed:", e);
    }
  };

  const handleCheckout = async () => {
    const missing = missingShippingFields(shipping.address);
    if (missing.length > 0) {
      // Name the fields. "Add a shipping address" was unhelpful when an address
      // was already filled in and only one field was blank.
      show({
        variant: "error",
        title: "Shipping address incomplete",
        message: `Add your ${missing.join(", ")} before checking out.`,
      });
      return;
    }
    try {
      setProcessing(true);
      // Payment-first checkout (11.5): reserves stock and starts payment
      // before any Order exists — the fee breakdown below comes straight
      // from this response, so the buyer sees it before Paystack.
      const init = await initializeCheckoutPayment(
        buildCheckoutPaymentInitRequest(
          shipping.address!,
          fulfilmentPreference,
          reliabilityFeeOptedIn
        )
      );
      // Same reason as the other checkout path: the key exists to make a retry
      // of *this* attempt safe, and reusing it for the next one replays the
      // previous order.
      clearIdempotencyKey("checkout-cart");
      router.push({
        pathname: "/checkout/confirm",
        params: {
          payment_id: init.payment_id,
          authorization_url: init.authorization_url ?? "",
          subtotal: String(init.subtotal),
          shipping_fee: String(init.shipping_fee),
          delivery_count: String(init.delivery_count),
          service_fee: String(init.service_fee),
          reliability_fee_opted_in: String(init.reliability_fee_opted_in),
          reliability_fee_estimate: String(init.reliability_fee_estimate),
          capture_ceiling: String(init.capture_ceiling),
          amount: String(init.amount),
        },
      });
    } catch (err) {
      logger.error("Checkout failed:", err);
      // The error was logged and then thrown away in favour of a fixed
      // sentence, so a rejected payload and a dropped connection looked
      // identical to the buyer -- and "try again" only helps for one of them.
      show({
        variant: "error",
        title: "Checkout failed",
        message: friendlyErrorMessage(
          err,
          "We couldn't create your order. Please check your details and try again."
        ),
      });
    } finally {
      setProcessing(false);
    }
  };

  // ---------- States ----------
  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        <Text className={`mt-3 font-medium text-text-primary`}>Loading your cart…</Text>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
          <TouchableOpacity onPress={() => router.back()} className={`h-10 w-10 rounded items-center justify-center bg-surface-sunken`}>
            <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
          </TouchableOpacity>
          <Text className={`flex-1 text-center text-xl font-bold pr-10 text-text-primary`}>Cart</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
        >
          <View className="mb-5">
            <ShoppingCart size={44} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={1.5} />
          </View>
          <Text className={`text-2xl font-bold text-text-primary`}>Your cart is empty</Text>
          <Text className={`mt-2 text-base text-center leading-6 text-text-secondary`}>
            Explore the marketplace and add items you love.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center"
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start shopping"
          >
            <Text className="text-white font-bold">Start shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Main ----------
  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
        <TouchableOpacity onPress={() => router.back()} className={`h-10 w-10 rounded items-center justify-center bg-surface-sunken`}>
          <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-center text-xl font-bold pr-10 text-text-primary`}>Cart</Text>
      </View>

      <ScrollView
        className="flex-1 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Items container */}
        <View className="px-6 mt-6">
          <View className={`rounded border overflow-hidden ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            {cart.items?.map((item, idx) => {
              const image = item.product?.images?.[0]?.media?.original_url ?? "";
              const name = item.product?.name ?? "Product";
              const price =
                (item.product as any)?.price ??
                (item as any)?.unit_price ??
                0;
              const lineTotal = Number(price) * (item.quantity ?? 1);

              return (
                <View key={item.id} className={`px-4 py-5 ${idx !== cart.items?.length - 1 ? (isDark ? "border-b border-border-strong" : "border-b border-border") : ""}`}>
                  <View className="flex-row gap-4">
                    <Image source={{ uri: image }} className={`w-20 h-20 rounded bg-surface-sunken`} />
                    <View className="flex-1">
                      <Text className={`font-bold text-base text-text-primary`} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className={`text-xs mt-1 text-text-secondary`}>
                        Variant #{item.variant_id}
                      </Text>

                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className={`font-bold text-text-primary`}>{formatMoney(price)}</Text>

                        {/* Stepper + remove */}
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item, item.quantity - 1)}
                            className={`w-8 h-8 rounded border items-center justify-center ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
                            activeOpacity={0.8}
                          >
                            <Text className={`text-lg font-bold text-text-primary`}>−</Text>
                          </TouchableOpacity>

                          <View className="min-w-[32px] items-center justify-center">
                            <Text className={`font-bold text-text-primary`}>{item.quantity}</Text>
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
                            className={`ml-2 w-8 h-8 rounded border items-center justify-center ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
                            activeOpacity={0.8}
                          >
                            <Trash2 size={14} color={isDark ? "#f0f1f2" : "#000000"} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mt-3 flex-row justify-between">
                        <Text className={`text-xs text-text-secondary`}>Line total</Text>
                        <Text className={`text-xs font-bold text-text-primary`}>
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

        {/* Shipping address */}
        <View className="px-6 mt-6">
          <ShippingAddressCard
            address={shipping.address}
            source={shipping.source}
            loading={shipping.loading}
            locating={shipping.locating}
            locationDenied={shipping.locationDenied}
            useCurrentLocation={shipping.useCurrentLocation}
            updateAddress={shipping.updateAddress}
            isDark={isDark}
          />
        </View>

        {/* Summary card */}
        <View className="px-6">
          <View className={`rounded border p-6 ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}>
            <Text className={`text-lg font-bold mb-4 text-text-primary`}>Order Summary</Text>

            <View className="flex-row justify-between py-2">
              <Text className={`text-sm text-text-secondary`}>Subtotal</Text>
              <Text className={`text-sm font-bold text-text-primary`}>{formatMoney(summary?.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className={`text-sm text-text-secondary`}>Discount</Text>
              <Text className={`text-sm font-bold text-text-primary`}>−{formatMoney(summary?.discount)}</Text>
            </View>
            <View className={`h-[1px] my-4 ${isDark ? "bg-[#46464e]" : "bg-border"}`} />
            <View className="flex-row justify-between py-2">
              <Text className={`text-base font-bold text-text-primary`}>Total</Text>
              <Text className={`text-lg font-bold text-text-primary`}>{formatMoney(summary?.total)}</Text>
            </View>
            <Text className={`text-xs text-text-secondary`}>
              Service fee, and the reliability fee if you opt in, are shown at the next step.
            </Text>

            <View className={`h-[1px] my-4 ${isDark ? "bg-[#46464e]" : "bg-border"}`} />

            {/* Fulfilment preference (6): how a substitution is handled if an item can't be fulfilled as ordered */}
            <Text className={`text-sm font-bold mb-2 text-text-primary`}>
              If an item can&apos;t be fulfilled
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { id: "auto", label: "Auto-substitute" },
                  { id: "ask", label: "Ask me first" },
                  { id: "seller_only", label: "Don't substitute" },
                ] as { id: FulfilmentPreference; label: string }[]
              ).map((opt) => {
                const selected = fulfilmentPreference === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setFulfilmentPreference(opt.id)}
                    className={`flex-1 px-2 py-2 rounded border items-center justify-center ${
                      selected
                        ? "border-primary bg-primary/10"
                        : isDark
                          ? "border-border-strong"
                          : "border-border"
                    }`}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      className={`text-xs text-center font-medium ${
                        selected ? "text-primary font-bold" : isDark ? "text-text-secondary" : "text-tertiary"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reliability fee opt-in (11.2): only ever charged if a reroute fires */}
            <TouchableOpacity
              onPress={() => setReliabilityFeeOptedIn((v) => !v)}
              className="flex-row items-center justify-between mt-4 py-2"
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: reliabilityFeeOptedIn }}
            >
              <View className="flex-1 pr-3">
                <Text className={`text-sm font-medium text-text-primary`}>
                  Guarantee my order
                </Text>
                <Text className={`text-xs mt-0.5 text-text-secondary`}>
                  A reliability fee applies only if a substitution happens.
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded items-center justify-center border ${
                  reliabilityFeeOptedIn
                    ? "bg-primary border-primary"
                    : isDark
                      ? "border-border-strong"
                      : "border-border"
                }`}
              >
                {reliabilityFeeOptedIn ? <Check size={16} color="#ffffff" /> : null}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={processing || !isShippingAddressUsable(shipping.address)}
              className={`mt-6 h-12 rounded items-center justify-center ${processing || !isShippingAddressUsable(shipping.address) ? (isDark ? "bg-surface-sunken" : "bg-surface") : "bg-primary"}`}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={processing ? "Processing" : "Proceed to checkout"}
            >
              <Text className={`text-base font-bold ${processing || !isShippingAddressUsable(shipping.address) ? (isDark ? "text-text-secondary" : "text-tertiary") : "text-white"}`}>
                {processing ? "Processing…" : "Proceed to Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
