/**
 * Seller-facing pending-allocations screen (12.1-12.2): accept/decline a
 * new fulfilment request within the response window, start preparing an
 * accepted one, or back out (13.4 anti-gaming "accept-then-cancel",
 * scored against Seller Reliability). Mirrors the buyer ASK-approval
 * decision pattern already used in app/notifications.tsx.
 *
 * Previously there was no screen for this at all -- a seller could only
 * read the FULFILMENT_REQUEST notification, with nowhere to act on it
 * in-app (see Unfinished-Tasks.md's old "no seller-side screen" item).
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock } from "lucide-react-native";
import {
  listSellerAllocations,
  acceptAllocation,
  declineAllocation,
  startPreparingAllocation,
  cancelAllocationAfterAccept,
  SellerAllocation,
} from "../../services/sections/fulfilment";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";

type RowAction = "accept" | "decline" | "start-preparing" | "cancel";

const STATUS_LABEL: Record<string, string> = {
  awaiting_seller: "Awaiting your response",
  awaiting_buyer_approval: "Waiting on buyer approval",
  accepted: "Accepted",
  preparing: "Preparing",
};

export default function SellerAllocationsScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [items, setItems] = useState<SellerAllocation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    listSellerAllocations()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (allocation: SellerAllocation, action: RowAction) => {
    setBusyId(allocation.id);
    try {
      if (action === "accept") await acceptAllocation(allocation.id);
      else if (action === "decline") await declineAllocation(allocation.id);
      else if (action === "start-preparing") await startPreparingAllocation(allocation.id);
      else await cancelAllocationAfterAccept(allocation.id);

      show({
        variant: "success",
        title:
          action === "accept"
            ? "Allocation accepted"
            : action === "decline"
              ? "Allocation declined"
              : action === "start-preparing"
                ? "Marked as preparing"
                : "Cancelled",
      });
      load();
    } catch {
      show({ variant: "error", title: "Couldn't complete that action", message: "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = (allocation: SellerAllocation) => {
    Alert.alert(
      "Back out of this order?",
      "This counts against your reliability score, same as declining -- only do this if you genuinely can't fulfil it.",
      [
        { text: "Never mind", style: "cancel" },
        { text: "Cancel anyway", style: "destructive", onPress: () => runAction(allocation, "cancel") },
      ],
    );
  };

  const cardClass = `rounded border p-4 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`;
  const labelClass = `text-sm ${isDark ? "text-dark-muted" : "text-tertiary"}`;
  const valueClass = `text-sm ${isDark ? "text-dark-text" : "text-black"}`;

  const ActionButton = ({
    label,
    onPress,
    primary,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    primary?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      className={`flex-1 h-9 rounded items-center justify-center ${primary ? "bg-primary" : isDark ? "bg-dark-elevated" : "bg-surface"} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-xs font-bold ${primary ? "text-white" : isDark ? "text-dark-text" : "text-black"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        <Text className={`flex-1 text-center text-lg font-bold -ml-10 ${isDark ? "text-dark-text" : "text-black"}`}>
          Fulfilment requests
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={isDark ? "#f5f5f5" : "#000000"} />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color={isDark ? "#f5f5f5" : "#000000"} />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center py-16">
            <Text className={`font-semibold text-lg text-center ${isDark ? "text-dark-text" : "text-black"}`}>
              Could not load requests
            </Text>
            <Text className={`${labelClass} mt-2 text-center`}>Pull down to try again.</Text>
          </View>
        ) : !items?.length ? (
          <View className="flex-1 justify-center items-center py-16">
            <Clock size={32} color={isDark ? "#c6c5cf" : "#71717A"} />
            <Text className={`font-semibold text-lg text-center mt-4 ${isDark ? "text-dark-text" : "text-black"}`}>
              Nothing pending
            </Text>
            <Text className={`${labelClass} mt-2 text-center px-6`}>
              New fulfilment requests will show up here.
            </Text>
          </View>
        ) : (
          items.map((a) => {
            const busy = busyId === a.id;
            return (
              <View key={a.id} className={`${cardClass} mb-3`}>
                <View className="flex-row items-center justify-between">
                  <Text className={`font-bold flex-1 pr-3 ${isDark ? "text-dark-text" : "text-black"}`} numberOfLines={1}>
                    {a.product_name ?? `Item #${a.order_item_id}`}
                  </Text>
                  <Text className={labelClass}>Qty {a.quantity}</Text>
                </View>
                <Text className={`${labelClass} mt-1`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                  {a.status === "awaiting_seller" && a.seller_response_deadline
                    ? ` · respond by ${new Date(a.seller_response_deadline).toLocaleTimeString()}`
                    : ""}
                </Text>

                {a.status === "awaiting_seller" && (
                  <View className="flex-row gap-2 mt-3">
                    <ActionButton
                      label={busy ? "Accepting…" : "Accept"}
                      primary
                      disabled={busy}
                      onPress={() => runAction(a, "accept")}
                    />
                    <ActionButton
                      label={busy ? "Declining…" : "Decline"}
                      disabled={busy}
                      onPress={() => runAction(a, "decline")}
                    />
                  </View>
                )}
                {a.status === "accepted" && (
                  <View className="flex-row gap-2 mt-3">
                    <ActionButton
                      label={busy ? "Updating…" : "Start preparing"}
                      primary
                      disabled={busy}
                      onPress={() => runAction(a, "start-preparing")}
                    />
                    <ActionButton
                      label="Can't fulfil"
                      disabled={busy}
                      onPress={() => confirmCancel(a)}
                    />
                  </View>
                )}
                {a.status === "preparing" && (
                  <View className="flex-row gap-2 mt-3">
                    <ActionButton
                      label="Can't fulfil"
                      disabled={busy}
                      onPress={() => confirmCancel(a)}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
