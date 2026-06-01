/**
 * Discover Shops — Full shop discovery with search and filters
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "lodash";
import { getShops, getShopCategories } from "../services/sections/shops";
import type { ShopLite, ShopCategory } from "../services/sections/shops";
import Avatar from "../components/Avatar";

function ShopRow({ shop, onPress }: { shop: ShopLite; onPress: () => void }) {
  const label = shop.shop_name || shop.user?.username || "Shop";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-6 py-4 border-b border-border bg-white"
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${label}`}
    >
      <Avatar uri={shop.user?.profile_picture} name={label} size={56} className="rounded" />
      <View className="flex-1 ml-4">
        <Text className="text-black font-geist font-bold text-base" numberOfLines={1}>
          {label}
        </Text>
        {shop.stats && (
          <Text className="text-tertiary font-inter text-xs mt-1">
            {shop.stats.product_count} products · {shop.stats.follower_count} followers
          </Text>
        )}
      </View>
      {shop.verification_status === "verified" && (
        <View className="px-2 py-0.5 rounded bg-surface">
          <Text className="text-tertiary font-geist font-medium text-[10px] uppercase tracking-wider">Verified</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DiscoverShopsScreen() {
  const router = useRouter();
  const [shops, setShops] = useState<ShopLite[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "name" | "recent" | "followers">("rating");

  const fetchShops = useCallback(
    async (p: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else if (p === 1) setLoading(true);
      try {
        const res = await getShops({
          page: p,
          per_page: 20,
          search: search || undefined,
          category: selectedCategory || undefined,
          sort_by: sortBy,
          active_only: true,
        });
        if (append) {
          setShops((prev) => [...prev, ...(res.shops ?? [])]);
        } else {
          setShops(res.shops ?? []);
        }
        setHasNext(res.pagination?.has_next ?? false);
        setPage(p);
      } catch {
        if (!append) setShops([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedCategory, sortBy]
  );

  const debouncedFetch = useCallback(
    debounce((p: number) => fetchShops(p, false), 350),
    [fetchShops]
  );

  useEffect(() => {
    fetchShops(1, false);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (search !== undefined) debouncedFetch(1);
  }, [search]);

  useEffect(() => {
    getShopCategories()
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasNext) fetchShops(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-6 py-4 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-geist font-bold text-black text-center pr-8">
          Discover Shops
        </Text>
      </View>

      <View className="px-4 py-3 flex-row items-center bg-surface rounded mx-6 mt-4">
        <Search size={20} color="#71717A" />
        <TextInput
          className="ml-3 flex-1 text-black font-inter text-base"
          placeholder="Search shops..."
          placeholderTextColor="#A1A1AA"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories Chips */}
      {categories.length > 0 && (
        <View className="mt-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 12 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className={`py-2 px-4 min-h-[40px] justify-center rounded ${selectedCategory === null ? "bg-primary" : "bg-surface"}`}
            >
              <Text
                className={`font-geist font-semibold text-sm ${selectedCategory === null ? "text-white" : "text-tertiary"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(c.slug)}
                className={`py-2 px-4 min-h-[40px] justify-center rounded ${selectedCategory === c.slug ? "bg-primary" : "bg-surface"}`}
              >
                <Text
                  className={`font-geist font-semibold text-sm ${selectedCategory === c.slug ? "text-white" : "text-tertiary"}`}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Chips */}
      <View className="mb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 12 }}
        >
          {(["rating", "followers", "recent", "name"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSortBy(s)}
              className={`py-1.5 px-3 min-h-[32px] justify-center rounded border ${sortBy === s ? "bg-primary border-primary" : "bg-transparent border-border"}`}
            >
              <Text
                className={`font-geist font-medium text-xs ${sortBy === s ? "text-white" : "text-tertiary"}`}
              >
                {s === "rating" ? "Top rated" : s === "followers" ? "Popular" : s === "recent" ? "Recent" : "A–Z"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-tertiary text-sm mt-2">Loading shops…</Text>
        </View>
      ) : shops.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className="text-black font-semibold text-lg text-center">No shops found</Text>
          <Text className="text-tertiary text-sm mt-2 text-center">
            Try a different search or filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ShopRow
              shop={item}
              onPress={() => router.push(`/shopDetails/${item.id}`)}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#000000" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
