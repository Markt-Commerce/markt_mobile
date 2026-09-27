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
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { KeyRound, Clock, PackageCheck, Type as TypeIcon } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { usePodCode } from "../../../hooks/usePodCode";
import { useTokens } from "../../../theme/useTokens";
import BackButton from "../../../components/BackButton";

export default function OrderPodCodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTokens();

  const [showAsText, setShowAsText] = useState(false);

  // Polled while the code is live, and invalidated when a delivery push
  // lands. The confirm happens on the rider's phone, so this screen
  // cannot learn it is finished any other way -- it used to fetch once
  // on mount and then show a QR code for a delivery that was over.
  const {
    data,
    isLoading: loading,
    isError: error,
    isRefetching: refreshing,
    refetch,
  } = usePodCode(id);

  const delivered = !!data?.delivered;

  // Once the rider has confirmed, this screen has nothing left to do.
  // Leaving it up is what put a spent QR code underneath the
  // gamification modal. A beat first, so the buyer sees it succeed
  // rather than being thrown out of a screen that never acknowledged
  // anything.
  useEffect(() => {
    if (!delivered) return;
    const timer = setTimeout(() => router.back(), 2200);
    return () => clearTimeout(timer);
  }, [delivered, router]);

  const cardClass = `rounded border p-4 bg-surface-raised border-border`;
  const labelClass = `text-sm text-text-secondary`;

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <BackButton fallback={"/(tabs)/orders"} />
        <Text
          className="flex-1 text-center text-lg font-bold -ml-10 text-text-primary"
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
            onRefresh={() => refetch()}
            tintColor={t.textPrimary}
          />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color={t.textPrimary} />
          </View>
        ) : error || !data ? (
          <View className="flex-1 justify-center items-center py-16">
            <Text className="font-semibold text-lg text-center text-text-primary">
              Could not load your code
            </Text>
            <Text className={`${labelClass} mt-2 text-center`}>Pull down to try again.</Text>
          </View>
        ) : delivered ? (
          <View className="flex-1 justify-center items-center py-16">
            <PackageCheck size={32} color={t.textPrimary} />
            <Text className="font-semibold text-lg text-center mt-4 text-text-primary">
              Delivered
            </Text>
            <Text className={`${labelClass} mt-2 text-center px-6`}>
              Your rider confirmed this order. The code has been used and is no
              longer needed.
            </Text>
          </View>
        ) : !data.ready || !data.code ? (
          <View className="flex-1 justify-center items-center py-16">
            <Clock size={32} color={t.textSecondary} />
            <Text className="font-semibold text-lg text-center mt-4 text-text-primary">
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
                  <KeyRound size={28} color={t.textPrimary} />
                  <Text className={`${labelClass} mt-4 text-center`}>
                    Read this code out to your rider to confirm delivery
                  </Text>
                  <Text
                    selectable
                    className="mt-4 text-center font-bold text-2xl tracking-[0.15em] text-text-primary"
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
                className="flex-row items-center gap-1.5 mt-5 h-9 px-4 rounded bg-media"
                accessibilityRole="button"
              >
                {showAsText ? (
                  <KeyRound size={14} color={t.textPrimary} />
                ) : (
                  <TypeIcon size={14} color={t.textPrimary} />
                )}
                <Text className="text-xs font-bold text-text-primary">
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
