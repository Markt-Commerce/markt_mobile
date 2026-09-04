import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package,
  Truck,
  CreditCard,
  Star,
  Megaphone,
  Clipboard,
  MessageSquare,
  User,
  AlertTriangle,
  Bell,
  CheckCheck,
  RotateCw,
} from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import ScreenHeader from "../components/ScreenHeader";
import { NotificationItem } from "../models/notifications";
import {
  getNotifications,
  markAllAsRead,
} from "../services/sections/notifications";
import {
  approveSubstitution,
  rejectSubstitution,
} from "../services/sections/fulfilment";
import { submitDeliveryWaitChoice } from "../services/sections/orders";
import { useTheme } from "../components/themeProvider";
import { useToast } from "../components/ToastProvider";
import { useNotificationsBadge } from "../hooks/notificationsContext";
import { resolveNotificationRoute } from "../utils/notificationDeepLink";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import { friendlyErrorMessage } from "../utils/errorMessages";

type DecisionState = "pending" | "resolved" | "error";

// Keyed on the backend's NotificationType enum (app/notifications/models.py in
// markt_python) -- a type with no entry here falls back to the generic Bell.
const ICON_BY_TYPE: Record<string, React.ComponentType<any>> = {
  order_update: Package,
  order_placed: Package,
  order_cancelled: Package,
  cart_item_added: Package,
  shipment_update: Truck,
  delivery_failed: Truck,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  refund_issued: CreditCard,
  product_review: Star,
  review_upvote: Star,
  promotional: Megaphone,
  request_offer: Clipboard,
  offer_accepted: Clipboard,
  offer_rejected: Clipboard,
  offer_withdrawn: Clipboard,
  request_closed: Clipboard,
  request_status_change: Clipboard,
  request_expired: Clipboard,
  new_request_match: Clipboard,
  fulfilment_request: Clipboard,
  post_like: MessageSquare,
  post_comment: MessageSquare,
  niche_invitation: MessageSquare,
  niche_post_approved: MessageSquare,
  niche_post_rejected: MessageSquare,
  new_follower: User,
  substitution_approval_required: AlertTriangle,
  thin_volume_delivery_choice: AlertTriangle,
  item_unfulfilled: AlertTriangle,
  system_alert: AlertTriangle,
  moderation_action: AlertTriangle,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks in-progress/resolved state for the two notification types that
  // carry a pending buyer decision (9.1 ASK approval, 10.3 thin-volume
  // wait-vs-pay) -- surfaced in-app here rather than relying on the push
  // tap alone.
  const [decisionState, setDecisionState] = useState<Record<number, DecisionState>>({});
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();
  const { bumpUnread } = useNotificationsBadge();

  const ink = isDark ? "text-[#f0f1f2]" : "text-black";
  const muted = isDark ? "text-[#c6c5cf]" : "text-tertiary";
  const rule = isDark ? "border-[#46464e]" : "border-border";
  const iconColor = isDark ? "#f0f1f2" : "#000000";

  const load = useCallback(async (opts: { refresh?: boolean } = {}) => {
    if (opts.refresh) setRefreshing(true);
    setError(null);
    try {
      const notifs = await getNotifications(1, 20);
      setItems(notifs.items);
    } catch (e) {
      if ((e as { status?: number })?.status !== 401) {
        setError(friendlyErrorMessage(e, "We couldn't load your notifications."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onOpen = (n: NotificationItem) => {
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
      );
      bumpUnread(-1);
      markAllAsRead({ notification_ids: [n.id] }).catch(() => {
        // Best-effort -- not worth fighting the optimistic UI over a single
        // missed read receipt; the next full fetch will reconcile it.
      });
    }
    const route = resolveNotificationRoute(n);
    if (route) router.push(route as any);
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    bumpUnread(-unreadIds.length);
    try {
      await markAllAsRead({ notification_ids: unreadIds });
    } catch (e) {
      bumpUnread(unreadIds.length);
      setItems((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: false } : n)),
      );
      show({
        variant: "error",
        title: "Couldn't mark all as read",
        message: friendlyErrorMessage(e),
      });
    }
  };

  const hasUnread = items.some((n) => !n.is_read);

  const handleSubstitutionDecision = async (n: NotificationItem, approve: boolean) => {
    setDecisionState((prev) => ({ ...prev, [n.id]: "pending" }));
    try {
      if (approve) await approveSubstitution(n.reference_id);
      else await rejectSubstitution(n.reference_id);
      setDecisionState((prev) => ({ ...prev, [n.id]: "resolved" }));
      show({
        variant: "success",
        title: approve ? "Substitution approved" : "Substitution rejected",
        message: approve
          ? "We'll go ahead with the replacement seller."
          : "We'll keep looking for another match.",
      });
    } catch {
      setDecisionState((prev) => ({ ...prev, [n.id]: "error" }));
      show({ variant: "error", title: "Couldn't submit your decision", message: "Please try again." });
    }
  };

  const handleWaitChoice = async (n: NotificationItem, choice: "wait" | "pay_now") => {
    setDecisionState((prev) => ({ ...prev, [n.id]: "pending" }));
    try {
      // fallback_consent is always false here: the backend doesn't yet
      // collect the single-drop upcharge on consent (logged 10.3 gap in
      // deliveries/runs.py), so "wait" always resolves to either a fuller
      // run or a free cancellation -- never a silent surprise charge.
      await submitDeliveryWaitChoice(n.reference_id, choice, false);
      setDecisionState((prev) => ({ ...prev, [n.id]: "resolved" }));
      show({
        variant: "success",
        title: choice === "wait" ? "We'll wait for a fuller run" : "Paying for faster delivery",
        message:
          choice === "wait"
            ? "If it doesn't fill by the deadline, you'll be cancelled and refunded automatically."
            : "Your order will go out on the next available run.",
      });
    } catch {
      setDecisionState((prev) => ({ ...prev, [n.id]: "error" }));
      show({ variant: "error", title: "Couldn't submit your choice", message: "Please try again." });
    }
  };

  const DecisionButton = ({
    label,
    onPress,
    primary,
  }: {
    label: string;
    onPress: () => void;
    primary?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-1 h-9 rounded items-center justify-center ${primary ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className={`text-xs font-bold ${primary ? "text-white" : ink}`}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item: n }: { item: NotificationItem }) => {
    const state = decisionState[n.id];
    const Icon = ICON_BY_TYPE[n.type] ?? Bell;
    const needsSubstitutionDecision = n.type === "substitution_approval_required";
    const needsWaitChoice = n.type === "thin_volume_delivery_choice";
    const needsEscalationChoice = n.type === "item_unfulfilled";

    return (
      <TouchableOpacity
        onPress={() => onOpen(n)}
        activeOpacity={0.7}
        className={`flex-row items-start gap-4 px-6 py-4 border-b ${rule}`}
        accessibilityRole="button"
        accessibilityLabel={n.title || n.message}
      >
        <View
          className={`w-10 h-10 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
        >
          <Icon size={18} color={iconColor} strokeWidth={1.6} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`flex-1 text-[15px] font-semibold ${ink}`} numberOfLines={1}>
              {n.title}
            </Text>
            {!n.is_read && <View className="w-2 h-2 rounded-full bg-primary" />}
          </View>
          <Text className={`text-[13px] mt-1 leading-5 ${muted}`} numberOfLines={3}>
            {n.message}
          </Text>
          <Text className={`text-[11px] mt-1.5 ${muted}`}>{formatTimeAgo(n.created_at)}</Text>

          {(needsSubstitutionDecision || needsWaitChoice) && state !== "resolved" && (
            <View className="flex-row gap-2 mt-3">
              {state === "pending" ? (
                <Text className={`text-xs ${muted}`}>Submitting…</Text>
              ) : needsSubstitutionDecision ? (
                <>
                  <DecisionButton
                    label="Approve"
                    primary
                    onPress={() => handleSubstitutionDecision(n, true)}
                  />
                  <DecisionButton
                    label="Reject"
                    onPress={() => handleSubstitutionDecision(n, false)}
                  />
                </>
              ) : (
                <>
                  <DecisionButton
                    label="Wait for fuller run"
                    primary
                    onPress={() => handleWaitChoice(n, "wait")}
                  />
                  <DecisionButton label="Pay now" onPress={() => handleWaitChoice(n, "pay_now")} />
                </>
              )}
            </View>
          )}
          {(needsSubstitutionDecision || needsWaitChoice) && state === "resolved" && (
            <Text className="text-xs font-bold text-primary mt-2">Submitted</Text>
          )}

          {needsEscalationChoice && (
            <View className="flex-row gap-2 mt-3">
              <DecisionButton
                label="Choose what happens next"
                primary
                onPress={() => router.push(`/orders/escalation/${n.reference_id}` as any)}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader
        title="Alerts"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            onPress={markAllRead}
            disabled={!hasUnread}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            accessibilityState={{ disabled: !hasUnread }}
          >
            <CheckCheck size={20} color={hasUnread ? iconColor : isDark ? "#46464e" : "#D4D4D8"} strokeWidth={1.75} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94C2A" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className={`text-[15px] text-center leading-6 ${ink}`}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              load();
            }}
            className="mt-6 h-12 px-8 rounded bg-primary items-center justify-center flex-row gap-2"
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <RotateCw size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs tracking-[2px] uppercase">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ refresh: true })}
              tintColor="#E94C2A"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-10 pt-24">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              >
                <Bell size={30} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1.6} />
              </View>
              <Text className={`text-xl font-bold text-center ${ink}`}>You're all caught up</Text>
              <Text className={`text-[15px] mt-2 text-center leading-6 ${muted}`}>
                New alerts about orders, messages and more will show up here.
              </Text>
            </View>
          }
          contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
