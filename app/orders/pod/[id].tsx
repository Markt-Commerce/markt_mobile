/**
 * 10.6 POD handshake, buyer side: displays the delivery code so the
 * rider can read/scan it back and confirm receipt. The rider's confirm
 * call (single-order and run-based, markt_python) already just takes a
 * qr_code string with no assumption about how the rider learned it, so
 * this screen alone closes the buyer-facing half of the handshake.
 *
 * Shows a real scannable QR image by default (react-native-qrcode-svg,
 * built on react-native-svg -- already a dependency, no native module),
 * with a toggle to fall back to the plain-text code for a rider who
 * can't scan (no camera capability built into markt_logistics yet,
 * poor lighting, etc).
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, KeyRound, Clock, Type as TypeIcon } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { getPodCode } from "../../../services/sections/orders";
import { PodCode } from "../../../models/orders";
import { useTheme } from "../../../components/themeProvider";

export default function OrderPodCodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<PodCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [showAsText, setShowAsText] = useState(false);

  const load = useCallback(
    (isRefresh = false) => {
      if (!id) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      getPodCode(id)
        .then(setData)
        .catch(() => setError(true))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const cardClass = `rounded border p-4 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`;
  const labelClass = `text-sm ${isDark ? "text-dark-muted" : "text-tertiary"}`;

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
          className={`flex-1 text-center text-lg font-bold -ml-10 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Delivery code
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={isDark ? "#f5f5f5" : "#000000"}
          />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color={isDark ? "#f5f5f5" : "#000000"} />
          </View>
        ) : error || !data ? (
          <View className="flex-1 justify-center items-center py-16">
            <Text className={`font-semibold text-lg text-center ${isDark ? "text-dark-text" : "text-black"}`}>
              Could not load your code
            </Text>
            <Text className={`${labelClass} mt-2 text-center`}>Pull down to try again.</Text>
          </View>
        ) : !data.ready || !data.code ? (
          <View className="flex-1 justify-center items-center py-16">
            <Clock size={32} color={isDark ? "#c6c5cf" : "#71717A"} />
            <Text className={`font-semibold text-lg text-center mt-4 ${isDark ? "text-dark-text" : "text-black"}`}>
              No code yet
            </Text>
            <Text className={`${labelClass} mt-2 text-center px-6`}>
              Your delivery code will appear here once a rider is on the way. Pull down
              to refresh.
            </Text>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-10">
            <View className={`${cardClass} items-center px-8 py-10`}>
              {showAsText ? (
                <>
                  <KeyRound size={28} color={isDark ? "#f5f5f5" : "#000000"} />
                  <Text className={`${labelClass} mt-4 text-center`}>
                    Read this code out to your rider to confirm delivery
                  </Text>
                  <Text
                    selectable
                    className={`mt-4 text-center font-bold text-2xl tracking-[0.15em] ${isDark ? "text-dark-text" : "text-black"}`}
                  >
                    {data.code}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={`${labelClass} mb-4 text-center`}>
                    Show this to your rider to scan and confirm delivery
                  </Text>
                  <View className="bg-white p-3 rounded">
                    <QRCode value={data.code} size={180} />
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => setShowAsText((prev) => !prev)}
                activeOpacity={0.8}
                className={`flex-row items-center gap-1.5 mt-5 h-9 px-4 rounded ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
                accessibilityRole="button"
              >
                {showAsText ? (
                  <KeyRound size={14} color={isDark ? "#f5f5f5" : "#000000"} />
                ) : (
                  <TypeIcon size={14} color={isDark ? "#f5f5f5" : "#000000"} />
                )}
                <Text className={`text-xs font-bold ${isDark ? "text-dark-text" : "text-black"}`}>
                  {showAsText ? "Show QR instead" : "Show code instead"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
