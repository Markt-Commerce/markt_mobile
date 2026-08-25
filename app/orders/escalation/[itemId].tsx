/**
 * 7.3: buyer-facing resolution screen for an item Markt couldn't find a
 * replacement seller for (NotificationType.ITEM_UNFULFILLED). Reached
 * either by tapping "Choose what happens next" on that notification
 * (app/notifications.tsx) or via its push-notification deep link
 * (utils/notificationDeepLink.ts, reference_type="order_item").
 *
 * Offers 3 of the spec's 4 escalation options -- choose a replacement
 * seller from the auto-generated reroute request's offers, remove just
 * this item (refunded), or cancel the whole order. The 4th ("source
 * from a second market for a fee") isn't offered: it needs a real
 * cross-market delivery-fee calculation that doesn't exist yet (same
 * gap already flagged against the Phase 13 multi-market basket UI) --
 * see get_item_escalation's docstring in markt_python.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Store, PackageX, XCircle } from "lucide-react-native";
import {
  getItemEscalation,
  removeEscalatedItem,
  ItemEscalation,
} from "../../../services/sections/fulfilment";
import { acceptRequestOffer } from "../../../services/sections/requests";
import { cancelOrder } from "../../../services/sections/orders";
import { useTheme } from "../../../components/themeProvider";
import { useToast } from "../../../components/ToastProvider";

export default function ItemEscalationScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [data, setData] = useState<ItemEscalation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"remove" | "cancel" | null>(null);

  const load = useCallback(() => {
    if (!itemId) return;
    setLoading(true);
    setError(false);
    getItemEscalation(itemId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChooseSeller = async (offerId: number) => {
    setBusyOfferId(offerId);
    try {
      await acceptRequestOffer(offerId);
      show({
        variant: "success",
        title: "Seller confirmed",
        message: "We've reopened fulfilment with your chosen seller.",
      });
      load();
    } catch {
      show({ variant: "error", title: "Couldn't confirm that seller", message: "Please try again." });
    } finally {
      setBusyOfferId(null);
    }
  };

  const confirmRemoveItem = () => {
    Alert.alert(
      "Remove this item?",
      "You'll be refunded for this item. The rest of your order is unaffected.",
      [
        { text: "Keep waiting", style: "cancel" },
        { text: "Remove & refund", style: "destructive", onPress: handleRemoveItem },
      ],
    );
  };

  const handleRemoveItem = async () => {
    setBusyAction("remove");
    try {
      await removeEscalatedItem(itemId);
      show({ variant: "success", title: "Item removed", message: "You've been refunded for this item." });
      load();
    } catch {
      show({ variant: "error", title: "Couldn't remove this item", message: "Please try again." });
    } finally {
      setBusyAction(null);
    }
  };

  const confirmCancelOrder = () => {
    if (!data) return;
    Alert.alert(
      "Cancel the whole order?",
      "Every item in this order will be cancelled and refunded, not just this one.",
      [
        { text: "Never mind", style: "cancel" },
        { text: "Cancel order", style: "destructive", onPress: handleCancelOrder },
      ],
    );
  };

  const handleCancelOrder = async () => {
    if (!data) return;
    setBusyAction("cancel");
    try {
      await cancelOrder(data.order_id, "buyer_cancelled_after_escalation");
      show({ variant: "success", title: "Order cancelled", message: "You've been refunded." });
      router.replace(`/orderdetail/${data.order_id}` as any);
    } catch {
      show({ variant: "error", title: "Couldn't cancel this order", message: "Please try again." });
    } finally {
      setBusyAction(null);
    }
  };

  const cardClass = `rounded border p-4 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`;
  const labelClass = `text-sm ${isDark ? "text-dark-muted" : "text-tertiary"}`;
  const valueClass = `text-sm ${isDark ? "text-dark-text" : "text-black"}`;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`h-10 w-10 rounded items-center justify-center border ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={isDark ? "#f5f5f5" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`flex-1 text-center text-lg font-geist font-bold -ml-10 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Resolve item
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f5f5f5" : "#000000"} />
        </View>
      ) : error || !data ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className={`font-semibold text-lg text-center ${isDark ? "text-dark-text" : "text-black"}`}>
            Could not load this item
          </Text>
          <Text className={`${labelClass} mt-2 text-center`}>Please try again later.</Text>
        </View>
      ) : !data.escalated ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <PackageX size={32} color={isDark ? "#c6c5cf" : "#71717A"} />
          <Text className={`font-semibold text-lg text-center mt-4 ${isDark ? "text-dark-text" : "text-black"}`}>
            Nothing to resolve
          </Text>
          <Text className={`${labelClass} mt-2 text-center`}>
            This item isn't awaiting a decision right now.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className={cardClass}>
            <Text className={`font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}>
              We couldn't find a replacement seller
            </Text>
            <Text className={`${labelClass} mt-1`}>
              Qty {data.quantity} · ₦{data.price.toFixed(2)}
            </Text>
          </View>

          {/* Choose a seller */}
          <View className="mt-4">
            <Text
              className={`text-[10px] font-geist font-bold uppercase tracking-[0.2em] mb-2 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              Choose a seller
            </Text>
            {data.reroute_request?.offers.length ? (
              <View className={`${cardClass} p-0 overflow-hidden`}>
                {data.reroute_request.offers.map((offer, idx) => (
                  <View
                    key={offer.id}
                    className={`flex-row items-center justify-between p-4 ${
                      idx !== data.reroute_request!.offers.length - 1
                        ? isDark
                          ? "border-b border-dark-border"
                          : "border-b border-border"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-3">
                      <Store size={18} color={isDark ? "#f5f5f5" : "#000000"} />
                      <View className="flex-1">
                        <Text className={valueClass} numberOfLines={1}>
                          {offer.seller_name ?? `Seller #${offer.seller_id}`}
                        </Text>
                        <Text className={labelClass}>₦{offer.price.toFixed(2)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleChooseSeller(offer.id)}
                      disabled={busyOfferId === offer.id}
                      className="h-9 px-4 rounded bg-primary items-center justify-center"
                      activeOpacity={0.85}
                    >
                      <Text className="text-xs font-geist font-bold text-white">
                        {busyOfferId === offer.id ? "Confirming…" : "Choose"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View className={cardClass}>
                <Text className={labelClass}>
                  We're still looking for a replacement seller in your market. Check back
                  soon, or pick one of the options below.
                </Text>
              </View>
            )}
          </View>

          {/* Other options */}
          <View className="mt-6">
            <Text
              className={`text-[10px] font-geist font-bold uppercase tracking-[0.2em] mb-2 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              Other options
            </Text>
            <TouchableOpacity
              onPress={confirmRemoveItem}
              disabled={busyAction !== null}
              activeOpacity={0.85}
              className={`${cardClass} flex-row items-center justify-between mb-3`}
            >
              <View>
                <Text className={`font-semibold ${isDark ? "text-dark-text" : "text-black"}`}>
                  Remove this item
                </Text>
                <Text className={labelClass}>Refunded, rest of the order is unaffected</Text>
              </View>
              <Text className="text-xs font-geist font-bold text-primary">
                {busyAction === "remove" ? "Removing…" : "Remove"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmCancelOrder}
              disabled={busyAction !== null}
              activeOpacity={0.85}
              className={cardClass}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <XCircle size={16} color="#e26136" />
                  <Text className={`font-semibold ${isDark ? "text-dark-text" : "text-black"}`}>
                    Cancel whole order
                  </Text>
                </View>
                <Text className="text-xs font-geist font-bold" style={{ color: "#e26136" }}>
                  {busyAction === "cancel" ? "Cancelling…" : "Cancel"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
