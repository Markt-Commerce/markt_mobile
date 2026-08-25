import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Truck,
  Package,
  User,
  Dot,
  PlusSquare,
  Search,
  Home,
  LucideIcon,
  Bell,
  Check,
  MessageSquare,
  Tag,
} from "lucide-react-native";
import { TouchableOpacity } from "react-native";
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
import { useRouter } from "expo-router";
import { useTheme } from "../components/themeProvider";
import { useToast } from "../components/ToastProvider";

type DecisionState = "pending" | "resolved" | "error";

// ---- Small presentational helpers ----
const IconBubble = ({
  Cmp,
  isDark,
}: {
  Cmp?: React.ComponentType<any>;
  isDark: boolean;
}) => (
  <View
    className={`w-12 h-12 rounded items-center justify-center ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
  >
    {Cmp ? (
      <Cmp size={20} color={isDark ? "#f5f5f5" : "#000000"} strokeWidth={1.5} />
    ) : (
      <Bell
        size={20}
        color={isDark ? "#f5f5f5" : "#000000"}
        strokeWidth={1.5}
      />
    )}
  </View>
);

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"all" | "orders" | "messages" | "promos">(
    "all",
  );
  // Tracks in-progress/resolved state for the two notification types that
  // carry a pending buyer decision (9.1 ASK approval, 10.3 thin-volume
  // wait-vs-pay) -- surfaced in-app here rather than relying on the push
  // tap alone, since deep-linking by notification type isn't wired yet
  // (see NotificationsBootstrap.tsx).
  const [decisionState, setDecisionState] = useState<Record<number, DecisionState>>({});
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

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

  useEffect(() => {
    const getpresentNotifs = async () => {
      try {
        const notifs = await getNotifications(20);
        setItems(notifs.items);
      } catch {
        setItems([]);
      }
    };
    getpresentNotifs();
  }, []);

  // ... filtered logic
  const filtered = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "orders") return items?.filter((n) => n.type === "icon");
    if (tab === "messages")
      return items?.filter((n) => n.type === "avatar" || n.type === "icon");
    return items?.filter((n) => n.type === "icon"); // promos
  }, [items, tab]);

  const today = filtered?.slice(0, 3);
  const yesterday = filtered?.slice(3);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const notifs = await getNotifications(20);
      setItems(notifs.items);
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const markAllRead = () => {
    setItems((prev) => prev?.map((n) => ({ ...n, is_read: true })));
  };

  const TabPill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`px-4 py-2 rounded ${
        active ? "bg-primary" : isDark ? "bg-dark-elevated" : "bg-surface"
      }`}
    >
      <Text
        className={`text-xs font-geist font-bold ${active ? "text-white" : "text-tertiary"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
      className={`flex-1 h-9 rounded items-center justify-center ${primary ? "bg-primary" : isDark ? "bg-dark-elevated" : "bg-surface"}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={`text-xs font-geist font-bold ${primary ? "text-white" : isDark ? "text-dark-text" : "text-black"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const Row = ({ n }: { n: NotificationItem }) => {
    const state = decisionState[n.id];
    const needsSubstitutionDecision = n.type === "substitution_approval_required";
    const needsWaitChoice = n.type === "thin_volume_delivery_choice";
    const needsEscalationChoice = n.type === "item_unfulfilled";

    return (
      <View className="flex-row items-start gap-4 px-5 py-5">
        <IconBubble isDark={isDark} />

        <View className="flex-1">
          <Text
            className={`font-geist font-bold text-sm ${isDark ? "text-dark-text" : "text-black"}`}
          >
            {n.title}
          </Text>
          <Text
            className={`text-sm font-inter mt-1 leading-5 ${n.is_read ? (isDark ? "text-dark-muted" : "text-tertiary") : isDark ? "text-dark-text font-medium" : "text-black font-medium"}`}
            numberOfLines={3}
          >
            {n.message}
          </Text>
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} font-inter text-[10px] mt-1.5`}
          >
            {n.created_at}
          </Text>

          {(needsSubstitutionDecision || needsWaitChoice) && state !== "resolved" && (
            <View className="flex-row gap-2 mt-3">
              {state === "pending" ? (
                <Text className={`text-xs font-inter ${isDark ? "text-dark-muted" : "text-tertiary"}`}>
                  Submitting…
                </Text>
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
                  <DecisionButton
                    label="Pay now"
                    onPress={() => handleWaitChoice(n, "pay_now")}
                  />
                </>
              )}
            </View>
          )}
          {(needsSubstitutionDecision || needsWaitChoice) && state === "resolved" && (
            <Text className="text-xs font-geist font-bold text-primary mt-2">Submitted</Text>
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
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`h-10 w-10 rounded border items-center justify-center ${isDark ? "bg-dark-surface border-dark-border" : "bg-surface border-border"}`}
          activeOpacity={0.8}
        >
          <ArrowLeft
            size={20}
            color={isDark ? "#f5f5f5" : "#000000"}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
        <Text
          className={`flex-1 text-center text-lg font-geist font-bold tracking-widest uppercase pr-10 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Alerts
        </Text>
      </View>

      {/* Tabs + mark-all */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center justify-between gap-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            <View className="flex-row gap-3">
              <TabPill
                label="ALL"
                active={tab === "all"}
                onPress={() => setTab("all")}
              />
              <TabPill
                label="ORDERS"
                active={tab === "orders"}
                onPress={() => setTab("orders")}
              />
              <TabPill
                label="MESSAGES"
                active={tab === "messages"}
                onPress={() => setTab("messages")}
              />
            </View>
          </ScrollView>
          <TouchableOpacity
            onPress={markAllRead}
            className="h-10 px-4 rounded bg-primary items-center justify-center"
            activeOpacity={0.85}
          >
            <Text className="text-[10px] font-geist font-bold text-white tracking-widest uppercase">
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lists */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#f5f5f5" : "#000000"}
          />
        }
      >
        <View className="px-6">
          <View
            className={`rounded border overflow-hidden ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          >
            <Text className="px-6 pt-6 pb-2 text-[10px] font-geist font-bold uppercase tracking-[0.2em] text-tertiary">
              Recents
            </Text>
            {today?.length ? (
              today.map((n, i) => (
                <View
                  key={n.id}
                  className={`${i !== today.length - 1 ? (isDark ? "border-b border-dark-border" : "border-b border-border") : ""}`}
                >
                  <Row n={n} />
                </View>
              ))
            ) : (
              <View className="px-6 pb-10 pt-4">
                <Text
                  className={`${isDark ? "text-dark-muted" : "text-surface-dim"} font-geist font-bold text-xs tracking-widest uppercase italic`}
                >
                  No Activity
                </Text>
              </View>
            )}
          </View>

          {yesterday?.length ? (
            <View
              className={`rounded border overflow-hidden mt-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
            >
              <Text className="px-6 pt-6 pb-2 text-[10px] font-geist font-bold uppercase tracking-[0.2em] text-tertiary">
                Previous
              </Text>
              {yesterday.map((n, i) => (
                <View
                  key={n.id}
                  className={`${i !== yesterday.length - 1 ? (isDark ? "border-b border-dark-border" : "border-b border-border") : ""}`}
                >
                  <Row n={n} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
