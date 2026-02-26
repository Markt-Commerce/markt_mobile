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
      className="flex-row items-center px-4 py-3 border-b border-border-light bg-white"
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${label}`}
    >
      <Avatar uri={shop.user?.profile_picture} name={label} size={56} />
      <View className="flex-1 ml-4">
        <Text className="text-text-primary font-semibold text-base" numberOfLines={1}>
          {label}
        </Text>
        {shop.stats && (
          <Text className="text-text-secondary text-xs mt-0.5">
            {shop.stats.product_count} products · {shop.stats.follower_count} followers
          </Text>
        )}
      </View>
      {shop.verification_status === "verified" && (
        <View className="px-2 py-0.5 rounded bg-primary-muted">
          <Text className="text-primary text-xs font-semibold">Verified</Text>
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
      else setLoading(true);
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
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#171311" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-text-primary text-center pr-10">
          Discover Shops
        </Text>
      </View>

      <View className="px-4 py-3 flex-row items-center bg-bg-muted rounded-xl mx-4 mt-3">
        <Search size={20} color="#876d64" />
        <TextInput
          className="ml-3 flex-1 text-text-primary text-base"
          placeholder="Search shops..."
          placeholderTextColor="#876d64"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {categories.length > 0 && (
        <View className="border-b border-border pb-1 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 24 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className="py-2 min-h-[44px] justify-center relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedCategory === null }}
            >
              <Text
                className={`font-semibold text-sm ${selectedCategory === null ? "text-text-primary" : "text-text-secondary"}`}
              >
                All
              </Text>
              {selectedCategory === null && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#e26136",
                    borderRadius: 1,
                  }}
                />
              )}
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(c.slug)}
                className="py-2 min-h-[44px] justify-center relative"
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedCategory === c.slug }}
              >
                <Text
                  className={`font-semibold text-sm ${selectedCategory === c.slug ? "text-text-primary" : "text-text-secondary"}`}
                >
                  {c.name}
                </Text>
                {selectedCategory === c.slug && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: "#e26136",
                      borderRadius: 1,
                    }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="border-b border-border pb-1 mb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 24 }}
        >
          {(["rating", "followers", "recent", "name"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSortBy(s)}
              className="py-2 min-h-[44px] justify-center relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: sortBy === s }}
            >
              <Text
                className={`font-semibold text-sm ${sortBy === s ? "text-text-primary" : "text-text-secondary"}`}
              >
                {s === "rating" ? "Top rated" : s === "followers" ? "Popular" : s === "recent" ? "Recent" : "A–Z"}
              </Text>
              {sortBy === s && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#e26136",
                    borderRadius: 1,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator size="large" color="#e26136" />
          <Text className="text-text-secondary text-sm mt-2">Loading shops…</Text>
        </View>
      ) : shops.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className="text-text-primary font-semibold text-lg text-center">No shops found</Text>
          <Text className="text-text-secondary text-sm mt-2 text-center">
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
                <ActivityIndicator size="small" color="#e26136" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
