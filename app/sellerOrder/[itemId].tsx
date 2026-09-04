/**
 * A seller's view of one order item.
 *
 * Sellers used to be sent to /orderdetail/<order_id> — the *buyer's* screen,
 * which knows nothing about roles — so a seller opening their own order was
 * offered "Pay now" and "Track Order" on a sale they were meant to fulfil.
 *
 * Actions live here rather than as Accept/Decline buttons in the list, so
 * there's one place a seller acts on an order however they got to it, and so
 * declining can carry the warning it deserves: it refunds the buyer.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Image as ImageIcon, MessageSquare } from "lucide-react-native";
import Avatar from "../../components/Avatar";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { getSellerOrders, updateSellerOrderItem } from "../../services/sections/orders";
import type { SellerOrderItem } from "../../models/orders";
import { formatNaira } from "../../utils/formatCurrency";
import { formatStatus, statusTone } from "../../utils/formatStatus";
import {
  nextStatuses,
  STATUS_ACTION_LABEL,
  type OrderItemStatus,
} from "../../utils/orderTransitions";
import { friendlyErrorMessage } from "../../utils/errorMessages";

const TONE_BG: Record<string, [string, string]> = {
  positive: ["bg-[#E7F6EC]", "bg-[#1E3A28]"],
  attention: ["bg-[#FEF3E2]", "bg-[#3A2E18]"],
  negative: ["bg-[#FDECEC]", "bg-[#3A1E1E]"],
  neutral: ["bg-[#F4F4F5]", "bg-[#2f3132]"],
};
const TONE_TEXT: Record<string, [string, string]> = {
  positive: ["text-[#0F7B3F]", "text-[#7BD9A2]"],
  attention: ["text-[#A15C00]", "text-[#F0B667]"],
  negative: ["text-[#C42B2B]", "text-[#F09A9A]"],
  neutral: ["text-[#52525B]", "text-[#c6c5cf]"],
};

export default function SellerOrderDetail() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [item, setItem] = useState<SellerOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);

  // There is no GET for a single seller order item, so the item is found in
  // the seller's own list. Bounded by the page size rather than fetching
  // everything.
  const load = useCallback(async () => {
    try {
      const res = await getSellerOrders(1, 50);
      const found = (res.items ?? []).find((i) => String(i.id) === String(itemId));
      setItem(found ?? null);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async (next: OrderItemStatus) => {
    if (!item) return;
    setWorking(true);
    try {
      await updateSellerOrderItem(item.id, { status: next });
      show({
        variant: "success",
        title:
          next === "cancelled"
            ? "Order declined"
            : `Marked ${(STATUS_ACTION_LABEL[next] ?? next).toLowerCase()}`,
      });
      await load();
    } catch (e) {
      show({
        variant: "error",
        title: "Couldn't update",
        // The server names both states on an illegal move, which is the only
        // version a seller can act on.
        message: friendlyErrorMessage(e, "Could not update this order."),
      });
    } finally {
      setWorking(false);
    }
  };

  const confirmThen = (next: OrderItemStatus) => {
    if (next !== "cancelled") return apply(next);
    // Declining refunds the buyer. Saying so is the difference between a
    // decision and an accident.
    Alert.alert(
      "Decline this order?",
      "The buyer is refunded and the item is cancelled. This can't be undone.",
      [
        { text: "Keep order", style: "cancel" },
        { text: "Decline", style: "destructive", onPress: () => apply(next) },
      ]
    );
  };

  const bg = isDark ? "#1a1c1d" : "#FFFFFF";
  const strong = isDark ? "text-[#f0f1f2]" : "text-black";
  const muted = isDark ? "text-[#8f9195]" : "text-tertiary";
  const card = isDark ? "bg-[#2f3132]" : "bg-[#F7F7F8]";

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className={`text-[17px] font-semibold ${strong}`}>Order not found</Text>
          <Text className={`text-[14px] mt-1 text-center ${muted}`}>
            It may have been fulfilled or cancelled already.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 h-11 rounded-lg bg-primary items-center justify-center"
          >
            <Text className="text-white font-semibold">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const buyer = item.order?.buyer;
  const buyerName = buyer?.buyername || buyer?.username || "Buyer";
  const tone = statusTone(item.status);
  const actions = nextStatuses(item.status);
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`text-[17px] font-bold ml-3 ${strong}`} numberOfLines={1}>
          {item.order?.order_number ?? `Order ${item.order_id ?? ""}`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={isDark ? "#f0f1f2" : "#000000"}
          />
        }
      >
        <View className="px-4">
          <View className={`rounded-xl p-4 ${card}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-[1.5px] ${muted}`}>
              Status
            </Text>
            <View className="flex-row items-center mt-2">
              <View className={`px-2.5 py-1 rounded-full ${TONE_BG[tone][isDark ? 1 : 0]}`}>
                <Text
                  className={`text-[13px] font-semibold ${TONE_TEXT[tone][isDark ? 1 : 0]}`}
                >
                  {formatStatus(item.status)}
                </Text>
              </View>
            </View>
          </View>

          <View className={`rounded-xl p-4 mt-3 ${card}`}>
            <View className="flex-row">
              {item.product?.image_url ? (
                <Image
                  source={{ uri: item.product.image_url }}
                  className="w-16 h-16 rounded-lg"
                />
              ) : (
                <View
                  className={`w-16 h-16 rounded-lg items-center justify-center ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
                >
                  <ImageIcon size={20} color={isDark ? "#6b6d71" : "#C4C4C8"} />
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className={`text-[15px] font-semibold ${strong}`} numberOfLines={2}>
                  {item.product?.name ?? "Product"}
                </Text>
                <Text className={`text-[13px] mt-1 ${muted}`}>
                  Qty {item.quantity ?? 1} · {formatNaira(item.price ?? 0)} each
                </Text>
                <Text className={`text-[17px] font-bold mt-1 ${strong}`}>
                  {formatNaira(lineTotal)}
                </Text>
              </View>
            </View>
          </View>

          <View className={`rounded-xl p-4 mt-3 ${card}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-[1.5px] ${muted}`}>
              Buyer
            </Text>
            <View className="flex-row items-center mt-2">
              <Avatar
                uri={buyer?.profile_picture_url ?? buyer?.profile_picture ?? undefined}
                name={buyerName}
                size={36}
              />
              <Text className={`flex-1 ml-3 text-[15px] font-semibold ${strong}`}>
                {buyerName}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/messages" as any)}
                className={`flex-row items-center px-3 h-9 rounded-lg ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
                accessibilityRole="button"
                accessibilityLabel={`Message ${buyerName}`}
              >
                <MessageSquare size={14} color={isDark ? "#c6c5cf" : "#3F3F46"} />
                <Text className={`text-[13px] font-semibold ml-1.5 ${strong}`}>
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Only moves the item can actually make. Delivery is deliberately
              absent: it's confirmed by the buyer or the rider through the
              POD/QR flow, and the server refuses it here. */}
          <View className="mt-5">
            {actions.length === 0 ? (
              <Text className={`text-[14px] text-center ${muted}`}>
                Nothing left to do on this order.
              </Text>
            ) : (
              actions.map((next) => {
                const destructive = next === "cancelled";
                return (
                  <TouchableOpacity
                    key={next}
                    onPress={() => confirmThen(next)}
                    disabled={working}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={STATUS_ACTION_LABEL[next] ?? next}
                    accessibilityState={{ busy: working, disabled: working }}
                    className={`h-12 rounded-xl items-center justify-center mb-2.5 ${
                      working ? "opacity-60" : ""
                    } ${
                      destructive
                        ? isDark
                          ? "bg-[#3A1E1E]"
                          : "bg-[#FDECEC]"
                        : "bg-primary"
                    }`}
                  >
                    {working ? (
                      <ActivityIndicator color={destructive ? "#C42B2B" : "#FFFFFF"} />
                    ) : (
                      <Text
                        className={`text-[15px] font-bold ${
                          destructive ? "text-[#C42B2B]" : "text-white"
                        }`}
                      >
                        {STATUS_ACTION_LABEL[next] ?? next}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
