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

const AVATAR_SIZE = 64;

export default function ShopStrip() {
  const [shops, setShops] = useState<ShopLite[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      <View className="py-4 border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="items-center" style={{ width: AVATAR_SIZE + 24 }}>
              <View
                className="rounded-full bg-bg-muted"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              />
              <View className="mt-2 h-3 w-16 bg-bg-muted rounded" />
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
        className="mx-4 my-4 py-3 rounded-xl bg-bg-muted flex-row items-center justify-center gap-2"
        accessibilityRole="button"
        accessibilityLabel="Discover shops"
      >
        <Text className="text-text-primary font-semibold text-sm">Discover shops</Text>
        <ChevronRight size={18} color="#171311" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="py-4 border-b border-border bg-white flex-row items-center">
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
                className="items-center justify-center rounded-full overflow-hidden"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderWidth: isVerified ? 2.5 : 0,
                  borderColor: "#e26136",
                }}
              >
                <Avatar
                  uri={shop.user?.profile_picture}
                  name={label}
                  size={isVerified ? AVATAR_SIZE - 5 : AVATAR_SIZE}
                />
              </View>
              <Text
                className="mt-2 text-text-primary text-xs font-medium text-center"
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
        className="flex-row items-center gap-1.5 px-3 py-2 mr-4 rounded-full bg-bg-muted"
        accessibilityRole="button"
        accessibilityLabel="Discover more shops"
      >
        <Text className="text-text-secondary text-xs font-semibold">See all</Text>
        <ChevronRight size={16} color="#876d64" />
      </TouchableOpacity>
    </View>
  );
}
