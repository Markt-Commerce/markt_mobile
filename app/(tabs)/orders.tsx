/**
 * Orders — Unified cart + orders (Chowdeck-style)
 *
 * Tabs: My Cart | Ongoing | Completed (buyer)
 *       Seller orders (seller mode)
 */

import React, { useCallback, useState , useEffect} from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Trash2, RefreshCw, Info, ShoppingCart } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  getCartSummary,
  checkoutCart,
} from "../../services/sections/cart";
import { getBuyerOrders, getSellerOrders , getBuyerPendingCount } from "../../services/sections/orders";
import { buildCheckoutRequest } from "../../utils/checkoutPayload";
import { Cart, CartItem, CartSummary } from "../../models/cart";
import type { Order, SellerOrderItem } from "../../models/orders";
import { useToast } from "../../components/ToastProvider";
import OrdersList from "../../components/orderList";
import { useTheme } from "../../components/themeProvider";
import { useTokens } from "../../theme/useTokens";
import { useShippingAddress } from "../../hooks/useShippingAddress";
import {
  isShippingAddressUsable,
  missingShippingFields,
} from "../../utils/shippingAddress";
import { clearIdempotencyKey } from "../../utils/idempotency";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import ShippingAddressCard from "../../components/shippingAddressCard";
import DeliveryQuoteCard from "../../components/checkout/DeliveryQuoteCard";
import BatchDeliveryOption from "../../components/checkout/BatchDeliveryOption";
import { useDeliveryQuote } from "../../hooks/useDeliveryQuote";
import { isActiveOrder, isPastOrder } from "../../utils/orderStatus";
import { onBadgeChanged } from "../../utils/badgeEvents";

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
  const t = useTokens();
  const [cart, setCart] = useState<Cart | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const shipping = useShippingAddress();
  // Checkout creates the order and empties the cart before payment, so an
  // abandoned attempt leaves the buyer looking at "your cart is empty" with
  // an unpaid order one tab away and nothing saying so.
  const [unpaid, setUnpaid] = useState<Order | null>(null);
  const delivery = useDeliveryQuote(cart, shipping.address, shipping.source);
  // Never inferred: the buyer has to choose to share, because under
  // charge-then-refund their money leaves and comes back.
  const [batchOptIn, setBatchOptIn] = useState(false);

  const fetchCart = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const [cartData, summaryData] = await Promise.all([getCart(), getCartSummary()]);
      setCart(cartData);
      setSummary(summaryData);
      try {
        const orders = await getBuyerOrders(1, 10);
        setUnpaid(
          orders?.find((o) => o.status === "pending_payment") ?? null
        );
      } catch {
        // A prompt is a courtesy; the cart still works without it.
        setUnpaid(null);
      }
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
  }, []);

  // Re-check the backend every time this tab gains focus, not just on first
  // mount — the bottom tab navigator keeps this screen alive, so switching
  // away and back wouldn't otherwise trigger a refetch.
  useFocusEffect(
    useCallback(() => {
      fetchCart({ silent: true });
    }, [fetchCart])
  );

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
    const missing = missingShippingFields(shipping.address);
    if (delivery.blocked) {
      // Checkout here creates the order and empties the cart, so letting this
      // through would strand someone with an unpayable order and no basket.
      show({
        variant: "error",
        title: delivery.blocked.title,
        message: delivery.blocked.message,
      });
      return;
    }
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
      const checkout = await checkoutCart(
        buildCheckoutRequest(
          shipping.address!,
          "Checkout from mobile",
          // Without it the server uses its flat estimate, so a failed quote
          // still lets someone buy something.
          delivery.quote?.id,
          batchOptIn
        )
      );
      // The attempt is over the moment an order exists, so the key retires
      // here. It only ever existed to make a *retry of this attempt* safe.
      //
      // It used to be cleared solely inside payment-result's try block, after
      // verifyPayment succeeded — so if the buyer never reached that screen, or
      // verification threw, the key survived the whole app session. The next
      // checkout then replayed it and the server correctly returned the FIRST
      // order: the app jumped to an already-paid order and the cart was never
      // cleared, because a replay must not touch a cart that now holds
      // different items.
      clearIdempotencyKey("checkout-cart");
      show({
        variant: "success",
        title: "Checkout successful",
        message: "Proceeding to payment.",
      });
      fetchCart();
      router.push(`/checkout/payment-method/${checkout.order_id}`);
    } catch (e) {
      // Was a bare `catch {}` that discarded the error and always said "Please
      // try again" -- advice that could never work when the cause was a
      // rejected payload rather than a transient failure.
      show({
        variant: "error",
        title: "Checkout failed",
        message: friendlyErrorMessage(
          e,
          "We couldn't create your order. Please check your details and try again."
        ),
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator size="large" color={t.textPrimary} />
      </View>
    );
  }

  if (!cart || !cart.items?.length) {
    return (
        <View className="flex-1 items-center justify-center px-6 py-16" >
          <View className="mb-5">
            <ShoppingCart size={44} color={t.textMuted} strokeWidth={1.5} />
          </View>
        <Text className="text-[22px] font-bold text-center text-text-primary">
          {unpaid ? "Your order is waiting to be paid" : "Your cart is empty"}
        </Text>
        <Text className="text-[15px] text-center mt-2 leading-[21px] text-text-muted">
          {unpaid
            ? "It's held for you until you pay."
            : "Add items from the feed to get started."}
        </Text>
        {unpaid ? (
          <TouchableOpacity
            onPress={() => router.push(`/checkout/payment-method/${unpaid.id}` as any)}
            accessibilityRole="button"
            className="mt-6 h-12 px-7 rounded-xl bg-primary-fill items-center justify-center"
          >
            <Text className="text-white font-semibold">Pay now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="mt-6 h-12 px-7 rounded-xl bg-primary-fill items-center justify-center"
          >
            <Text className="text-white font-semibold">Start shopping</Text>
          </TouchableOpacity>
        )}
        {unpaid ? (
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="mt-3 h-11 px-6 items-center justify-center"
          >
            <Text className="text-[14px] font-semibold text-text-secondary">
              Keep shopping
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCart(); }} tintColor={t.textPrimary} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-4">
        <View className={"bg-surface-raised"}>
          {cart.items.map((item, idx) => {
            const image = item.product?.images?.[0]?.media?.original_url ?? "";
            const name = item.product?.name ?? "Product";
            const price = (item.product as any)?.price ?? (item as any)?.unit_price ?? 0;
            const lineTotal = Number(price) * (item.quantity ?? 1);
            return (
              <View
                key={item.id}
                className={`px-4 py-3 ${idx !== cart.items!.length - 1 ? ("border-b border-border") : ""}`}
              >
                <View className="flex-row gap-3">
                  <Image source={{ uri: image }} className="w-16 h-16 rounded bg-surface-sunken" />
                  <View className="flex-1">
                    <Text className="font-semibold text-text-primary" numberOfLines={1}>{name}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="font-semibold text-text-primary">{formatMoney(price)}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-8 h-8 rounded items-center justify-center bg-surface-sunken"
                        >
                          <Text className="text-base font-bold text-text-primary">−</Text>
                        </TouchableOpacity>
                        <View className="min-w-[36px] h-8 rounded border items-center justify-center px-2 bg-surface-raised border-border">
                          <Text className="font-semibold text-text-primary">{item.quantity}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-primary-fill items-center justify-center"
                        >
                          <Text className="text-base font-bold text-white">+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemove(item)}
                          className="ml-1 w-8 h-8 rounded items-center justify-center bg-surface-sunken"
                        >
                          <Trash2 size={16} color={t.textPrimary} />
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
        {unpaid ? (
          // The cart survives checkout now, so an unpaid order normally sits
          // alongside a full basket. Without this the buyer has no idea the
          // earlier attempt is still waiting, and checking out again just
          // makes a second one.
          <TouchableOpacity
            onPress={() => router.push(`/checkout/payment-method/${unpaid.id}` as any)}
            accessibilityRole="button"
            className="mb-4 rounded-xl border border-warning bg-surface-sunken p-4"
          >
            <Text className="text-[15px] font-bold text-text-primary">
              You have an order waiting to be paid
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-text-secondary">
              Finish paying for it, or keep editing this basket and check out
              again.
            </Text>
            <Text className="mt-2 text-[14px] font-bold text-primary-text">
              Pay now
            </Text>
          </TouchableOpacity>
        ) : null}
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
        <DeliveryQuoteCard
          loading={delivery.loading}
          quote={delivery.quote}
          blocked={delivery.blocked}
          onFixAddress={shipping.useCurrentLocation}
        />
        <BatchDeliveryOption
          quote={delivery.quote}
          value={batchOptIn}
          onChange={setBatchOptIn}
        />
        <View className="mt-4 rounded border p-4 bg-surface-raised border-border">
          <Text className="text-base font-extrabold mb-2 text-text-primary">Order Summary</Text>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-text-secondary">Subtotal</Text>
            <Text className="text-sm text-text-primary">{formatMoney(summary?.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-text-secondary">Discount</Text>
            <Text className="text-sm text-text-primary">−{formatMoney(summary?.discount)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-text-secondary">Delivery</Text>
            <Text className="text-sm text-text-primary">
              {delivery.quote
                ? formatMoney(delivery.quote.fee_minor / 100)
                : delivery.loading
                  ? "…"
                  : "—"}
            </Text>
          </View>
          <View className="h-px my-2 bg-border" />
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm font-semibold text-text-primary">Total</Text>
            <Text className="text-sm font-extrabold text-text-primary">
              {formatMoney(
                Number(summary?.total ?? 0) +
                  (delivery.quote ? delivery.quote.fee_minor / 100 : 0)
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={
              processing ||
              !isShippingAddressUsable(shipping.address) ||
              !!delivery.blocked ||
              delivery.loading
            }
            className={`mt-4 h-12 rounded items-center justify-center ${processing || !isShippingAddressUsable(shipping.address) || !!delivery.blocked || delivery.loading ? ("bg-surface-sunken") : "bg-primary-fill"}`}
          >
            <Text className={processing || !isShippingAddressUsable(shipping.address) || !!delivery.blocked || delivery.loading ? ("text-text-secondary") : "text-white font-semibold"}>
              {processing
                ? "Processing…"
                : delivery.loading
                  ? "Working out delivery…"
                  : "Proceed to Checkout"}
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
      // Complementary by construction, so no status can fall through both
      // tabs -- which is what hid a paid `ready_for_delivery` order.
      return data.filter((o) =>
        activeTab === "ongoing" ? isActiveOrder(o.status) : isPastOrder(o.status)
      );
    },
    [activeTab]
  );

  return (
    <View className="flex-1">
      <View className="flex-1 bg-surface-raised">
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
    <View className="flex-1">
      <View className="flex-1 bg-surface-raised">
        <OrdersList
          fetchOrders={fetchOrders}
          isSeller
          // The seller's own screen, not /orderdetail — that one is the
          // buyer's view and offered a seller "Pay now" and "Track Order" on
          // a sale they were meant to fulfil.
          pressed={(item: SellerOrderItem) => {
            if (item.id) router.push(`/sellerOrder/${item.id}` as any);
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

  // Substitutions waiting on this buyer. Not a count of ongoing orders --
  // that number would never clear, and a badge that never clears is noise.
  const [needsAction, setNeedsAction] = useState(0);

  const refreshNeedsAction = useCallback(async () => {
    if (role !== "buyer") return;
    try {
      const res = await getBuyerPendingCount();
      setNeedsAction(res?.needs_action ?? 0);
    } catch {
      // A badge is decoration on a failure; the tab still works without it.
      setNeedsAction(0);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      refreshNeedsAction();
    }, [refreshNeedsAction])
  );
  useEffect(() => onBadgeChanged(refreshNeedsAction), [refreshNeedsAction]);

  const tabs =
    role === "buyer"
      ? [
        { id: "cart" as const, label: "My Cart", badge: 0 },
        { id: "ongoing" as const, label: "Ongoing", badge: needsAction },
        { id: "completed" as const, label: "Completed", badge: 0 },
      ]
      : [{ id: "ongoing" as const, label: "Orders", badge: 0 }];

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      <View className="px-4 pt-4 pb-2 bg-surface-page">
        <View className=" mb-3">
          <Text className="text-xl font-bold text-text-primary">Orders</Text>
          <View className="w-10" />
        </View>

        {/* Segmented control (Chowdeck-style) */}
        <View className="flex-row rounded p-1 bg-surface-sunken">
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded items-center ${activeTab === t.id ? ("bg-surface-raised") : ""}`}
            >
              <View className="flex-row items-center gap-1.5">
                <Text className={`text-sm font-semibold ${activeTab === t.id ? ("text-text-primary") : "text-text-secondary"}`}>
                  {t.label}
                </Text>
                {t.badge > 0 ? (
                  <View
                    className="min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center bg-primary-fill"
                    accessibilityLabel={`${t.badge} awaiting your decision`}
                  >
                    <Text className="text-[10px] font-bold text-text-on-primary">
                      {t.badge > 9 ? "9+" : t.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
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
