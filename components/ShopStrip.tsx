/**
 * ShopStrip — Instagram story–style horizontal shop strip
 *
 * Rounded-square shop marks + shop name, verified ring, "Discover more" tile.
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { getTrendingShops } from "../services/sections/shops";
import type { ShopLite } from "../services/sections/shops";
import Avatar from "./Avatar";
import { useTheme } from "./themeProvider";

const AVATAR_SIZE = 48;

export default function ShopStrip() {
  const [shops, setShops] = useState<ShopLite[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let cancelled = false;
    getTrendingShops()
      .then((res) => {
        if (!cancelled) setShops(res.shops ?? []);
      })
      .catch(() => {
        if (!cancelled) setShops([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View className={`py-3 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="items-center" style={{ width: AVATAR_SIZE + 14 }}>
              <View
                className={isDark ? "bg-[#2f3132]" : "bg-bg-muted"}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 12 }}
              />
              <View className={`mt-1.5 h-2.5 w-12 rounded ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (shops.length === 0) {
    return (
      <TouchableOpacity
        onPress={() => router.push("/discoverShops")}
        className={`mx-4 my-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2 ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
        accessibilityRole="button"
        accessibilityLabel="Discover shops"
      >
        <Text className={`font-semibold text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>Discover shops</Text>
        <ChevronRight size={18} color={isDark ? "#f0f1f2" : "#000000"} />
      </TouchableOpacity>
    );
  }

  return (
    <View className={`py-3 border-b flex-row items-center ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingRight: 10 }}
        style={{ flex: 1 }}
      >
        {shops.slice(0, 12).map((shop) => {
          const label = shop.shop_name || shop.user?.username || "Shop";
          const isVerified = shop.verification_status === "verified";

          return (
            <TouchableOpacity
              key={shop.id}
              onPress={() => router.push(`/shopDetails/${shop.id}`)}
              className="items-center"
              style={{ minWidth: AVATAR_SIZE + 14, minHeight: AVATAR_SIZE + 24 }}
              accessibilityRole="button"
              accessibilityLabel={`View ${label}`}
            >
              <View
                className="items-center justify-center overflow-hidden"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: 12,
                  borderWidth: isVerified ? 2.5 : 0,
                  borderColor: "#e26136",
                }}
              >
                <Avatar
                  uri={shop.user?.profile_picture}
                  name={label}
                  size={isVerified ? AVATAR_SIZE - 5 : AVATAR_SIZE}
                  shape="rounded"
                />
              </View>
              <Text
                className={`mt-1.5 text-[11px] font-medium text-center ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
                numberOfLines={1}
                style={{ maxWidth: AVATAR_SIZE + 14 }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push("/discoverShops")}
        className={`flex-row items-center gap-1 px-2.5 py-2 mr-3 rounded-full ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
        accessibilityRole="button"
        accessibilityLabel="Discover more shops"
      >
        <Text className={`text-xs font-semibold ${isDark ? "text-[#c6c5cf]" : "text-text-secondary"}`}>See all</Text>
        <ChevronRight size={16} color={isDark ? "#c6c5cf" : "#71717A"} />
      </TouchableOpacity>
    </View>
  );
}
