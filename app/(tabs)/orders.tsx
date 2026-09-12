/**
 * Orders — Unified cart + orders (Chowdeck-style)
 *
 * Tabs: My Cart | Ongoing | Completed (buyer)
 *       Seller orders (seller mode)
 */

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Trash2,
  RefreshCw,
  Info,
  ShoppingCart,
  Clock,
  SlidersHorizontal,
} from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  getCartSummary,
  checkoutCart,
} from "../../services/sections/cart";
import {
  getBuyerOrders,
  getSellerOrders,
  getBuyerPendingCount,
  updateSellerOrderItem,
} from "../../services/sections/orders";
import {
  nextStatuses,
  STATUS_ACTION_LABEL,
  type OrderItemStatus,
} from "../../utils/orderTransitions";
import SearchField from "../../components/SearchField";
import {
  FilterChip,
  FilterRail,
  RailDivider,
} from "../../components/FilterChip";
import { buildCheckoutRequest } from "../../utils/checkoutPayload";
import { Cart, CartItem, CartSummary } from "../../models/cart";
import type { Order, SellerOrderItem } from "../../models/orders";
import { useToast } from "../../components/ToastProvider";
import OrdersList from "../../components/orderList";
import { useTheme } from "../../components/themeProvider";
import { useTokens } from "../../theme/useTokens";
import { useShippingAddress } from "../../hooks/useShippingAddress";
import { clearIdempotencyKey } from "../../utils/idempotency";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import BatchDeliveryOption from "../../components/checkout/BatchDeliveryOption";
import CartGroupCard from "../../components/cart/CartGroupCard";
import CombinedDeliveryBanner from "../../components/cart/CombinedDeliveryBanner";
import AddressPickerSheet from "../../components/address/AddressPickerSheet";
import { getCartGroups } from "../../services/sections/cart";
import { getCombinedQuote, createDeliveryQuote } from "../../services/sections/delivery";
import type { CartGroup } from "../../models/cart";
import type { SavedAddress } from "../../models/addresses";
import type { CombinedDeliveryQuote } from "../../models/delivery";
import { useGroupQuotes } from "../../hooks/useGroupQuotes";
import {
  useSpendableDiscounts,
  eligibleBase,
} from "../../hooks/useSpendableDiscounts";
import { getUserProfile } from "../../services/sections/profile";
import type { RefundPreference } from "../../models/profile";
import ChatDiscountOption from "../../components/cart/ChatDiscountOption";
import { discountAmountFor } from "../../models/chat";
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
  // Which shop's card is checking out, not merely "something is". A single
  // shared flag put every card into "Working…" when one was tapped, which
  // reads as the whole basket being bought at once -- the opposite of what
  // splitting the cart is for.
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const { user } = useUser();
  const shipping = useShippingAddress();
  // Checkout creates the order and empties the cart before payment, so an
  // abandoned attempt leaves the buyer looking at "your cart is empty" with
  // an unpaid order one tab away and nothing saying so.
  const [unpaid, setUnpaid] = useState<Order | null>(null);
  // The basket as the orders it will become: one group per shop, because a
  // delivery quote prices one pickup to one dropoff.
  const [groups, setGroups] = useState<CartGroup[]>([]);
  // Where all of this is going. One address for the whole basket, not one per
  // card -- a buyer sending two orders to two different places is a case
  // nobody has asked for, and offering it would make the common case slower.
  const [address, setAddress] = useState<SavedAddress | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [combined, setCombined] = useState<CombinedDeliveryQuote | null>(null);
  const [combineOptIn, setCombineOptIn] = useState(false);
  // One quote per shop. A single cart-wide quote is meaningless once the
  // basket is split, and it was being suppressed entirely for multi-shop
  // baskets -- which left every Checkout enabled regardless of whether we
  // could deliver.
  const groupQuotes = useGroupQuotes(groups, address);
  // The chat offer worth the most on each shop's card, if the buyer holds
  // one. Accepting a discount in chat used to change nothing at checkout.
  const { byGroup: groupDiscounts, refresh: refreshDiscounts } =
    useSpendableDiscounts(groups);
  // Where this buyer asked for money owed back to go, so the share-a-trip
  // toggle can say what will actually happen rather than assuming the card.
  const [refundPreference, setRefundPreference] =
    useState<RefundPreference>("card");
  // Never inferred: the buyer has to choose to share, because under
  // charge-then-refund their money leaves and comes back.
  // Per shop, not per basket. Each card becomes its own order with its own
  // delivery and its own ceiling, so one cart-wide toggle had to pick a
  // single group's fee to quote and was wrong for every other one.
  const [batchOptIn, setBatchOptIn] = useState<Record<number, boolean>>({});

  // Which chat offer the buyer chose to spend on each shop's card, if any.
  // Opt-in: these are usually single-use, and spending one on a small basket
  // that the buyer was saving for a bigger one cannot be undone.
  const [appliedDiscount, setAppliedDiscount] = useState<
    Record<number, number | null>
  >({});

  const fetchCart = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const [cartData, summaryData] = await Promise.all([getCart(), getCartSummary()]);
      setCart(cartData);
      setSummary(summaryData);
      try {
        setGroups((await getCartGroups()).groups);
      } catch {
        // Falling back to one unnamed group keeps the basket usable if the
        // grouping call fails; an empty cart screen would be a lie.
        setGroups([]);
      }
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

  /** Ask whether one rider could collect from every shop in the basket.
   * Only meaningful with two or more shops and a chosen address. */
  const refreshCombined = useCallback(async () => {
    const sellerIds = groups
      .map((g) => g.seller_id)
      .filter((id): id is number => id != null);
    if (sellerIds.length < 2 || !address) {
      setCombined(null);
      setCombineOptIn(false);
      return;
    }
    try {
      setCombined(
        await getCombinedQuote({
          seller_ids: sellerIds,
          dropoff_latitude: address.latitude,
          dropoff_longitude: address.longitude,
        })
      );
    } catch {
      // Not being able to price a shared trip never blocks the separate ones.
      setCombined(null);
    }
  }, [groups, address]);

  useEffect(() => {
    refreshCombined();
  }, [refreshCombined]);

  useEffect(() => {
    let alive = true;
    getUserProfile()
      .then((profile) => {
        if (alive && profile?.buyer_account?.refund_preference) {
          setRefundPreference(profile.buyer_account.refund_preference);
        }
      })
      // The card is the default and the server decides for real either way;
      // a profile we could not read is not worth a visible failure here.
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /** Check out one shop's card. The rest of the basket stays where it is. */
  const checkoutGroup = async (group: CartGroup) => {
    // One at a time across the whole basket: two checkouts in flight would
    // race the same cart rows, and the second would price against a basket
    // the first is already turning into an order.
    if (checkingOut !== null) return;
    if (!address) {
      setPickerOpen(true);
      return;
    }
    try {
      setCheckingOut(group.seller_id ?? -1);
      // Already priced by useGroupQuotes; re-quoting here would charge for a
      // second quote row and could hand back a different number than the one
      // on the card.
      const quote =
        group.seller_id != null ? groupQuotes[group.seller_id]?.quote : null;

      const checkout = await checkoutCart({
        ...buildCheckoutRequest(
          {
            // An order's shipping address still requires these as fields, and
            // sending them empty is what produced "Missing required shipping
            // address field(s)" on tap. The name falls back to the account
            // holder, which is who the address belongs to.
            // Left unset when the address does not name someone: the server
            // fills in the buyer's own name, which it already knows.
            recipient_name: address.contact_name || undefined,
            street_address: address.formatted_address,
            city: address.city || "—",
            state: address.state || "—",
            country: "Nigeria",
            latitude: address.latitude,
            longitude: address.longitude,
          },
          address.directions || "Checkout from mobile",
          quote?.id,
          group.seller_id != null ? !!batchOptIn[group.seller_id] : false
        ),
        seller_id: group.seller_id ?? undefined,
        // Only when the buyer actually tapped it. The server re-checks the
        // offer against this shop and this total and spends it inside the
        // order transaction, so what is sent here is a request, not a price.
        discount_id:
          group.seller_id != null
            ? (appliedDiscount[group.seller_id] ?? undefined)
            : undefined,
      });
      clearIdempotencyKey("checkout-cart");
      fetchCart();
      // The offer is spent now. Refetch rather than assume, so a multi-use
      // one keeps showing and a single-use one stops.
      if (group.seller_id != null && appliedDiscount[group.seller_id]) {
        setAppliedDiscount((prev) => ({ ...prev, [group.seller_id!]: null }));
        refreshDiscounts();
      }
      router.push(`/checkout/payment-method/${checkout.order_id}`);
    } catch (e) {
      show({
        variant: "error",
        title: "Checkout failed",
        message: friendlyErrorMessage(
          e,
          "We couldn't create your order. Please try again."
        ),
      });
    } finally {
      setCheckingOut(null);
    }
  };

  // The old whole-basket checkout lived here. Removed with the grouped
  // cards: a second checkout path that nothing calls is exactly how the
  // two cart screens drifted into using different endpoints.

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

        {/* One card per shop. A delivery quote prices one pickup to one
            dropoff, so a basket spanning two shops is two orders -- showing
            it as a single list let a buyer build a cart that could never be
            paid for. */}
        <CombinedDeliveryBanner
          quote={combined}
          value={combineOptIn}
          onChange={setCombineOptIn}
        />

        {groups.map((g) => (
          <CartGroupCard
            key={String(g.seller_id ?? "unknown")}
            group={g}
            deliveringTo={address?.label || address?.formatted_address || null}
            deliveryFee={
              combineOptIn && combined?.available
                ? (combined.shares.find((s) => s.seller_id === g.seller_id)
                    ?.charged_minor ?? 0) / 100
                : g.seller_id != null && groupQuotes[g.seller_id]?.quote
                  ? groupQuotes[g.seller_id]!.quote!.fee_minor / 100
                  : null
            }
            blockedReason={
              g.seller_id != null
                ? (groupQuotes[g.seller_id]?.blocked?.message ?? null)
                : null
            }
            busy={checkingOut === (g.seller_id ?? -1)}
            // Every other card goes quiet rather than looking broken: they
            // are not busy, they are just not available while one is.
            disabled={checkingOut !== null}
            onCheckout={() => checkoutGroup(g)}
            onClear={() =>
              Promise.all(
                g.items.map((i) => deleteCartItem(i.id).catch(() => null))
              ).then(() => fetchCart())
            }
            onChangeAddress={() => setPickerOpen(true)}
            discountAmount={
              g.seller_id != null &&
              appliedDiscount[g.seller_id] &&
              groupDiscounts[g.seller_id]
                ? discountAmountFor(
                    groupDiscounts[g.seller_id],
                    eligibleBase(groupDiscounts[g.seller_id], g)
                  )
                : null
            }
            discountOption={
              g.seller_id != null && groupDiscounts[g.seller_id] ? (
                <ChatDiscountOption
                  discount={groupDiscounts[g.seller_id]}
                  subtotal={eligibleBase(groupDiscounts[g.seller_id], g)}
                  productName={
                    g.items?.find(
                      (i) => i.product_id === groupDiscounts[g.seller_id!].product_id
                    )?.product?.name ?? null
                  }
                  applied={
                    appliedDiscount[g.seller_id] ===
                    groupDiscounts[g.seller_id].id
                  }
                  disabled={checkingOut !== null}
                  onChange={(next) =>
                    setAppliedDiscount((prev) => ({
                      ...prev,
                      [g.seller_id!]: next
                        ? groupDiscounts[g.seller_id!].id
                        : null,
                    }))
                  }
                />
              ) : null
            }
            batchOption={
              g.seller_id != null ? (
                <BatchDeliveryOption
                  quote={groupQuotes[g.seller_id]?.quote ?? null}
                  refundPreference={refundPreference}
                  value={!!batchOptIn[g.seller_id]}
                  onChange={(next) =>
                    setBatchOptIn((prev) => ({ ...prev, [g.seller_id!]: next }))
                  }
                />
              ) : null
            }
          >
            {g.items.map((item) => (
              <View key={item.id} className="flex-row justify-between py-1.5">
                <Text className="flex-1 text-[13px] text-text-secondary" numberOfLines={1}>
                  {item.quantity} x {item.product?.name ?? "Item"}
                </Text>
                <Text className="text-[13px] text-text-primary">
                  {formatMoney((item.product_price ?? 0) * (item.quantity ?? 0))}
                </Text>
              </View>
            ))}
          </CartGroupCard>
        ))}

        <AddressPickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onChoose={setAddress}
          selectedId={address?.id ?? null}
        />
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

/** Statuses a seller filters by, in the order an item moves through them.
 *
 * "processing" was missing from the old screen's filters -- accepted but not
 * yet shipped is precisely the pile a seller needs to see. And its "Canceled"
 * chip was spelled with one L, which the backend enum has never used, so it
 * matched nothing and always showed an empty list. */
const SELLER_STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "New" },
  { key: "processing", label: "Accepted" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const SELLER_SORTS = [
  { key: "latest", label: "Latest" },
  { key: "price_desc", label: "Highest" },
  { key: "price_asc", label: "Lowest" },
] as const;

type SellerStatusFilter = (typeof SELLER_STATUS_FILTERS)[number]["key"];
type SellerSort = (typeof SELLER_SORTS)[number]["key"];

/**
 * The seller's orders.
 *
 * This used to be two screens. The one on the tab bar listed orders and
 * nothing else; a second, /(tabs)/sellerOrders, held the search, the status
 * filter, the sort and the only way to accept or ship an item -- and was
 * hidden from the tab bar behind a single tile on the dashboard. A seller who
 * never found that tile could not search their own orders, or advance one,
 * from anywhere in the app.
 *
 * One screen now. The filtering is client-side over the page the server
 * returns, exactly as it was before: making it server-side is a real change
 * to the orders endpoint, not part of merging two screens.
 */
function SellerOrdersTab({ isDark }: { isDark: boolean }) {
  const router = useRouter();
  const t = useTokens();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SellerStatusFilter>("all");
  const [sort, setSort] = useState<SellerSort>("latest");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOrders = useCallback(
    async (page: number): Promise<SellerOrderItem[]> => {
      const res = await getSellerOrders(page, 10);
      let items = res.items;

      if (status !== "all") {
        items = items.filter((i) => i.status === status);
      }

      const q = query.trim().toLowerCase();
      if (q) {
        items = items.filter((i) => i.product?.name?.toLowerCase().includes(q));
      }

      if (sort === "price_asc") {
        items = [...items].sort((a, b) => a.price - b.price);
      } else if (sort === "price_desc") {
        items = [...items].sort((a, b) => b.price - a.price);
      }
      return items;
    },
    [query, sort, status]
  );

  const updateStatus = async (
    item: SellerOrderItem,
    next: OrderItemStatus
  ) => {
    try {
      await updateSellerOrderItem(item.id!, { status: next });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      // The server names both states on an illegal move ("Cannot transition
      // from Status.PENDING to Status.SHIPPED"), which is more use than
      // "Failed to update order status".
      Alert.alert(
        "Couldn't update order",
        friendlyErrorMessage(e, "Failed to update order status.")
      );
    }
  };

  const openActions = (item: SellerOrderItem) => {
    const moves = nextStatuses(item.status);
    if (moves.length === 0) {
      // Nothing to do from here, so open the order rather than a menu with
      // only "Close" in it.
      if (item.id) router.push(`/sellerOrder/${item.id}` as any);
      return;
    }
    Alert.alert(
      "Update order status",
      item.product?.name ?? "Order item",
      // Only what the item can legally become from where it is. The menu used
      // to offer every action from every state, so "Mark Shipped" on a pending
      // item was a guaranteed 422. Mirrors OrderItem.VALID_STATUS_TRANSITIONS.
      [
        ...moves.map((next) => ({
          text: STATUS_ACTION_LABEL[next] ?? next,
          style: (next === "cancelled" ? "destructive" : "default") as
            | "destructive"
            | "default",
          onPress: () => updateStatus(item, next),
        })),
        {
          text: "Open order",
          onPress: () => {
            if (item.id) router.push(`/sellerOrder/${item.id}` as any);
          },
        },
        { text: "Close", style: "cancel" as const },
      ]
    );
  };

  // Refetching is what applies a filter, so the list has to be rebuilt when
  // one changes.
  const listKey = useMemo(
    () => `${status}|${sort}|${query}|${refreshKey}`,
    [status, sort, query, refreshKey]
  );

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 px-4 pt-3">
        <View className="flex-1">
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search by product"
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/fulfilment/allocations" as any)}
          accessibilityRole="button"
          accessibilityLabel="Pending fulfilment requests"
          className="h-11 flex-row items-center gap-1.5 rounded-xl border border-border bg-surface-sunken px-3"
        >
          <Clock size={16} color={t.textSecondary} />
          <Text className="text-[13px] font-semibold text-text-primary">
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status and sort share one rail, the shape the shop list settled on.
          Stacked rails ate a third of the screen before a single order
          appeared. Sort is the neutral tone so the two groups do not both
          shout. */}
      <View className="pt-3">
        <FilterRail>
          {SELLER_STATUS_FILTERS.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              active={status === key}
              onPress={() => setStatus(key)}
            />
          ))}
          <RailDivider />
          <SlidersHorizontal size={14} color={t.textMuted} strokeWidth={2} />
          {SELLER_SORTS.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              tone="neutral"
              active={sort === key}
              onPress={() => setSort(key)}
            />
          ))}
        </FilterRail>
      </View>

      <View className="flex-1 bg-surface-raised">
        <OrdersList
          key={listKey}
          fetchOrders={fetchOrders}
          isSeller
          // A tap is the seller's action menu -- accept, ship, cancel -- and
          // falls through to the order when there is nothing left to do.
          // Never /orderdetail: that is the buyer's view, and it offered a
          // seller "Pay now" on a sale they were meant to fulfil.
          pressed={openActions}
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
