/**
 * ShopStrip — Instagram story–style horizontal shop strip
 *
 * Circular avatars + shop name, verified ring, "Discover more" tile.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { getTrendingShops } from "../services/sections/shops";
import type { ShopLite } from "../services/sections/shops";
import Avatar from "./Avatar";
import { useTheme } from "./themeProvider";

const AVATAR_SIZE = 64;

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
      <View className={`py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="items-center" style={{ width: AVATAR_SIZE + 24 }}>
              <View
                className={`rounded ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              />
              <View className={`mt-2 h-3 w-16 rounded ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`} />
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
        className={`mx-4 my-4 py-3 rounded flex-row items-center justify-center gap-2 ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
        accessibilityRole="button"
        accessibilityLabel="Discover shops"
      >
        <Text className={`font-semibold text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>Discover shops</Text>
        <ChevronRight size={18} color={isDark ? "#f0f1f2" : "#000000"} />
      </TouchableOpacity>
    );
  }

  return (
    <View className={`py-4 border-b flex-row items-center ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 20, paddingRight: 12 }}
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
              style={{ minWidth: AVATAR_SIZE + 24, minHeight: AVATAR_SIZE + 36 }}
              accessibilityRole="button"
              accessibilityLabel={`View ${label}`}
            >
              <View
                className="items-center justify-center rounded overflow-hidden"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderWidth: isVerified ? 2.5 : 0,
                  borderColor: isDark ? "#f0f1f2" : "#000000",
                }}
              >
                <Avatar
                  uri={shop.user?.profile_picture}
                  name={label}
                  size={isVerified ? AVATAR_SIZE - 5 : AVATAR_SIZE}
                />
              </View>
              <Text
                className={`mt-2 text-xs font-medium text-center ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
                numberOfLines={1}
                style={{ maxWidth: AVATAR_SIZE + 16 }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push("/discoverShops")}
        className={`flex-row items-center gap-1.5 px-3 py-2 mr-4 rounded ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
        accessibilityRole="button"
        accessibilityLabel="Discover more shops"
      >
        <Text className={`text-xs font-semibold ${isDark ? "text-[#c6c5cf]" : "text-text-secondary"}`}>See all</Text>
        <ChevronRight size={16} color={isDark ? "#c6c5cf" : "#71717A"} />
      </TouchableOpacity>
    </View>
  );
}
