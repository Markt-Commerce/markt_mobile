/**
 * Discover Shops — Full shop discovery with search and filters
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { ArrowLeft, ArrowUpDown, Search } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "lodash";
import { getShops, getShopCategories } from "../services/sections/shops";
import type { ShopLite, ShopCategory } from "../services/sections/shops";
import Avatar from "../components/Avatar";
import { useTheme } from "../components/themeProvider";
import VerifiedBadge, { isVerifiedSeller } from "../components/VerifiedBadge";

function dedupeById<T extends { id: string | number }>(items: T[]): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function ShopRow({
  shop,
  onPress,
  isDark,
}: {
  shop: ShopLite;
  onPress: () => void;
  isDark: boolean;
}) {
  const label = shop.shop_name || shop.user?.username || "Shop";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-6 py-4 border-b ${isDark ? "bg-dark-page border-dark-border" : "bg-white border-border"}`}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${label}`}
    >
      <Avatar uri={shop.user?.profile_picture} name={label} size={56} />
      <View className="flex-1 ml-4">
        <Text
          className={`font-bold text-base ${isDark ? "text-dark-text" : "text-black"}`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {shop.stats && (
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} text-xs mt-1`}
          >
            {shop.stats.product_count} products · {shop.stats.follower_count}{" "}
            followers
          </Text>
        )}
      </View>
      {isVerifiedSeller(shop.verification_status) ? <VerifiedBadge /> : null}
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
  const [sortBy, setSortBy] = useState<
    "rating" | "name" | "recent" | "followers"
  >("rating");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Ref guard, not state — onEndReached can fire more than once before a state
  // update flushes, letting two calls fetch the same page and append duplicate
  // ids (causing the FlatList "same key" error).
  const fetchingRef = useRef(false);

  const fetchShops = useCallback(
    async (p: number, append: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
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
          setShops((prev) => dedupeById([...prev, ...(res.shops ?? [])]));
        } else {
          setShops(dedupeById(res.shops ?? []));
        }
        setHasNext(res.pagination?.has_next ?? false);
        setPage(p);
      } catch {
        if (!append) setShops([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [search, selectedCategory, sortBy],
  );

  const debouncedFetch = useCallback(
    debounce((p: number) => fetchShops(p, false), 350),
    [fetchShops],
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
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}
      edges={["top"]}
    >
      <View
        className={`flex-row items-center px-6 py-4 border-b ${isDark ? "border-dark-border" : "border-border"}`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={isDark ? "#f5f5f5" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`flex-1 text-xl font-bold text-center pr-8 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Discover Shops
        </Text>
      </View>

      <View
        className={`px-4 py-3 flex-row items-center rounded mx-6 mt-4 ${isDark ? "bg-dark-surface" : "bg-surface"}`}
      >
        <Search size={20} color={isDark ? "#c6c5cf" : "#71717A"} />
        <TextInput
          className={`ml-3 flex-1 text-base ${isDark ? "text-dark-text" : "text-black"}`}
          placeholder="Search shops..."
          placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* One filter row, not two. Categories and sort were separate stacked
          rails at 40pt and 32pt with their own padding — together they ate a
          third of the screen before a single shop appeared, and the two chip
          shapes (filled vs outlined) made them look like unrelated controls.
          Sort now leads the same rail, marked by its icon. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
          alignItems: "center",
        }}
      >
        <View className="flex-row items-center pr-0.5">
          <ArrowUpDown size={13} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
        </View>
        {(["rating", "followers", "recent", "name"] as const).map((srt) => {
          const active = sortBy === srt;
          const label =
            srt === "rating"
              ? "Top rated"
              : srt === "followers"
                ? "Popular"
                : srt === "recent"
                  ? "Recent"
                  : "A–Z";
          return (
            <TouchableOpacity
              key={srt}
              onPress={() => setSortBy(srt)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`px-3.5 h-8 rounded-full items-center justify-center ${
                active
                  ? isDark
                    ? "bg-[#f0f1f2]"
                    : "bg-black"
                  : isDark
                    ? "bg-[#2f3132]"
                    : "bg-[#F4F4F5]"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  active
                    ? isDark
                      ? "text-black"
                      : "text-white"
                    : isDark
                      ? "text-[#c6c5cf]"
                      : "text-[#52525B]"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {categories.length > 0 ? (
          <View className={`w-px h-5 mx-1 ${isDark ? "bg-[#46464e]" : "bg-[#E4E4E7]"}`} />
        ) : null}

        {categories.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedCategory === null }}
            className={`px-3.5 h-8 rounded-full items-center justify-center ${
              selectedCategory === null ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"
            }`}
          >
            <Text
              className={`text-[13px] font-semibold ${
                selectedCategory === null
                  ? "text-white"
                  : isDark
                    ? "text-[#c6c5cf]"
                    : "text-[#52525B]"
              }`}
            >
              All
            </Text>
          </TouchableOpacity>
        ) : null}
        {categories.map((c) => {
          const active = selectedCategory === c.slug;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCategory(c.slug)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`px-3.5 h-8 rounded-full items-center justify-center ${
                active ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  active ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-[#52525B]"
                }`}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator
            size="large"
            color={isDark ? "#f5f5f5" : "#000000"}
          />
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} text-sm mt-2`}
          >
            Loading shops...
          </Text>
        </View>
      ) : shops.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text
            className={`font-semibold text-lg text-center ${isDark ? "text-dark-text" : "text-black"}`}
          >
            No shops found
          </Text>
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} text-sm mt-2 text-center`}
          >
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
              isDark={isDark}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#f5f5f5" : "#000000"}
                />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
