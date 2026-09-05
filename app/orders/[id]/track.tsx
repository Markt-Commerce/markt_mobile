import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Truck,
  PackageCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react-native";
import { trackOrder } from "../../../services/sections/orders";
import { OrderTracking } from "../../../models/orders";
import { useTheme } from "../../../components/themeProvider";

// Overall-order stage order, used only to compute the progress bar --
// the timeline itself is rendered directly from the backend's entries.
const STAGE_ORDER = ["created", "paid", "shipped", "delivered"];

const ITEM_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function timelineIcon(status: string, isDark: boolean) {
  const color = isDark ? "#f5f5f5" : "#000000";
  if (status === "cancelled") return <XCircle size={16} color="#e26136" />;
  if (status === "delivered") return <CheckCircle2 size={16} color={color} />;
  if (status === "shipped") return <Truck size={16} color={color} />;
  if (status === "paid") return <PackageCheck size={16} color={color} />;
  return <Clock size={16} color={color} />;
}

export default function TrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    trackOrder(id)
      .then((data) => {
        if (!cancelled) setTracking(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const progressPct = useMemo(() => {
    if (!tracking) return 0;
    if (tracking.timeline.some((t) => t.status === "cancelled")) return 100;
    const reached = tracking.timeline
      .map((t) => STAGE_ORDER.indexOf(t.status))
      .filter((i) => i >= 0);
    const furthest = reached.length ? Math.max(...reached) : 0;
    return Math.round(((furthest + 1) / STAGE_ORDER.length) * 100);
  }, [tracking]);

  const cardClass = `rounded border p-4 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`;
  const labelClass = `text-sm ${isDark ? "text-dark-muted" : "text-tertiary"}`;
  const valueClass = `text-sm ${isDark ? "text-dark-text" : "text-black"}`;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      {/* Header */}
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
          className={`flex-1 text-center text-lg font-bold -ml-10 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Track order
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f5f5f5" : "#000000"} />
        </View>
      ) : error || !tracking ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className={`font-semibold text-lg text-center ${isDark ? "text-dark-text" : "text-black"}`}>
            Could not load tracking
          </Text>
          <Text className={`${labelClass} mt-2 text-center`}>Please try again later.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Progress header */}
          <View className="px-4">
            <View className={cardClass}>
              <View className="flex-row items-center justify-between">
                <Text className={`font-bold ${isDark ? "text-dark-text" : "text-black"}`}>
                  Order #{tracking.order_number ?? tracking.order_id}
                </Text>
                <Text className={`font-semibold ${isDark ? "text-dark-text" : "text-black"}`}>
                  {progressPct}%
                </Text>
              </View>
              <View className={`mt-3 h-2 w-full rounded overflow-hidden ${isDark ? "bg-dark-border" : "bg-border"}`}>
                <View className="h-2 bg-primary rounded" style={{ width: `${progressPct}%` }} />
              </View>
              <Text className={`mt-2 text-xs capitalize ${labelClass}`}>
                Status: {tracking.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View className="px-4 mt-4">
            <View className={cardClass}>
              {tracking.timeline.map((s, idx) => {
                const last = idx === tracking.timeline.length - 1;
                return (
                  <View key={`${s.status}-${idx}`} className="flex-row">
                    <View className="items-center mr-3">
                      <View
                        className={`h-6 w-6 rounded items-center justify-center ${isDark ? "bg-dark-elevated" : "bg-surface-dim"}`}
                      >
                        {timelineIcon(s.status, isDark)}
                      </View>
                      {!last && (
                        <View className={`flex-1 w-[2px] ${isDark ? "bg-dark-border" : "bg-border"}`} />
                      )}
                    </View>
                    <View className={`pb-5 ${last ? "pb-0" : ""} flex-1`}>
                      <Text className={`text-base font-semibold ${isDark ? "text-dark-text" : "text-black"}`}>
                        {s.label}
                      </Text>
                      {!!s.timestamp && (
                        <Text className={`text-xs mt-1 ${labelClass}`}>
                          {new Date(s.timestamp).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Per-item status */}
          <View className="px-4 mt-4">
            <View className={cardClass}>
              <Text className={`font-bold mb-3 ${isDark ? "text-dark-text" : "text-black"}`}>
                Items ({tracking.items.length})
              </Text>
              {tracking.items.map((item) => (
                <View
                  key={item.id}
                  className={`flex-row items-center justify-between py-2 ${isDark ? "border-dark-border" : "border-border"} ${item !== tracking.items[tracking.items.length - 1] ? "border-b" : ""}`}
                >
                  <View className="flex-1 pr-3">
                    <Text className={valueClass} numberOfLines={1}>
                      Item {item.id} · Qty {item.quantity}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-0.5 rounded bg-media`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-dark-muted" : "text-tertiary"}`}
                    >
                      {ITEM_STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Shipment */}
          {tracking.shipment && (
            <View className="px-4 mt-4">
              <View className={cardClass}>
                <Text className={`font-bold mb-2 ${isDark ? "text-dark-text" : "text-black"}`}>
                  Shipment
                </Text>
                {tracking.shipment.carrier && (
                  <View className="flex-row justify-between py-1.5">
                    <Text className={labelClass}>Carrier</Text>
                    <Text className={valueClass}>{tracking.shipment.carrier}</Text>
                  </View>
                )}
                {tracking.shipment.tracking_number && (
                  <View className="flex-row justify-between py-1.5">
                    <Text className={labelClass}>Tracking No.</Text>
                    <Text className={valueClass}>{tracking.shipment.tracking_number}</Text>
                  </View>
                )}
                {tracking.shipment.tracking_url && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(tracking.shipment!.tracking_url!)}
                    className="mt-2"
                  >
                    <Text className="text-primary text-sm font-semibold">View carrier tracking →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Rider / delivery assignment */}
          {tracking.delivery && (
            <View className="px-4 mt-4">
              <View className={cardClass}>
                <Text className={`font-bold mb-2 ${isDark ? "text-dark-text" : "text-black"}`}>
                  Delivery
                </Text>
                <View className="flex-row justify-between py-1.5">
                  <Text className={labelClass}>Status</Text>
                  <Text className={`${valueClass} capitalize`}>
                    {(tracking.delivery.logistical_status ?? tracking.delivery.status).replace(/_/g, " ")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/orders/pod/${tracking.order_id}` as any)}
                  className="mt-2"
                >
                  <Text className="text-primary text-sm font-semibold">
                    View my delivery code →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Shipping address */}
          {tracking.shipping_address && (
            <View className="px-4 mt-4">
              <View className={cardClass}>
                <View className="flex-row items-center gap-2 mb-2">
                  <MapPin size={16} color={isDark ? "#c6c5cf" : "#71717A"} />
                  <Text className={`font-bold ${isDark ? "text-dark-text" : "text-black"}`}>
                    Delivery address
                  </Text>
                </View>
                <Text className={valueClass}>
                  {[
                    tracking.shipping_address.recipient_name,
                    tracking.shipping_address.street_address,
                    tracking.shipping_address.city,
                    tracking.shipping_address.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>
          )}

          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
