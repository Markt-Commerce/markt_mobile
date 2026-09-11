/**
 * Discover Shops.
 *
 * Rebuilt around where the shopper is, which is the question the old screen
 * never asked. It was a flat alphabetical-ish list of contact rows with a sort
 * rail on top — usable, but it could not tell you whether a shop was down the
 * road or in another state.
 *
 * The reference for this is the delivery-app pattern (location header,
 * category chips, image-led cards), with one deliberate departure: those cards
 * lead with a delivery fee and an ETA, and Markt sellers have neither. Copying
 * the layout would have left the two most prominent slots empty. Distance is
 * the honest stand-in — it is real data, and it answers the same question.
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
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "lodash";
import {
  getShops,
  getShopCategories,
  type ShopLite,
  type ShopCategory,
  type ShopsLocationInfo,
} from "../services/sections/shops";
import ShopCard from "../components/shops/ShopCard";
import LocationSwitcher from "../components/location/LocationSwitcher";
import { useBrowseLocation } from "../hooks/browseLocationContext";
import { useTokens } from "../theme/useTokens";
import { ProductSkeletonRow } from "../components/SkeletonBlock";

type SortKey = "nearby" | "rating" | "followers" | "recent";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "nearby", label: "Nearest" },
  { key: "rating", label: "Top rated" },
  { key: "followers", label: "Popular" },
  { key: "recent", label: "New" },
];

function dedupeById<T extends { id: string | number }>(items: T[]): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function DiscoverShopsScreen() {
  const router = useRouter();
  const t = useTokens();
  const { location } = useBrowseLocation();

  const [shops, setShops] = useState<ShopLite[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [scope, setScope] = useState<ShopsLocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Default to nearest when we know where the user is, and to rating when we
  // do not. Sorting by a distance nobody can measure would just be rating
  // wearing a different label.
  const [sortBy, setSortBy] = useState<SortKey>(location ? "nearby" : "rating");

  // Ref guard, not state — onEndReached can fire more than once before a state
  // update flushes, letting two calls fetch the same page and append duplicate
  // ids (causing the FlatList "same key" error).
  const fetchingRef = useRef(false);

  const fetchShops = useCallback(
    async (p: number, append: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (append) setLoadingMore(true);
      else if (p === 1 && !append) setLoading(true);
      try {
        const res = await getShops({
          page: p,
          per_page: 20,
          search: search || undefined,
          category: selectedCategory || undefined,
          sort_by: sortBy,
          active_only: true,
          // Sent whatever the sort is: a distance is worth showing on a
          // top-rated list too. The server only *filters* on it for "nearby".
          latitude: location?.latitude,
          longitude: location?.longitude,
        });
        setShops((prev) =>
          append ? dedupeById([...prev, ...(res.shops ?? [])]) : dedupeById(res.shops ?? [])
        );
        setScope(res.location ?? null);
        setHasNext(res.pagination?.has_next ?? false);
        setPage(p);
      } catch {
        if (!append) {
          setShops([]);
          setScope(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        fetchingRef.current = false;
      }
    },
    [search, selectedCategory, sortBy, location?.latitude, location?.longitude]
  );

  const debouncedFetch = useCallback(
    debounce((p: number) => fetchShops(p, false), 350),
    [fetchShops]
  );

  useEffect(() => {
    fetchShops(1, false);
  }, [selectedCategory, sortBy, location?.latitude, location?.longitude]);

  useEffect(() => {
    debouncedFetch(1);
  }, [search]);

  useEffect(() => {
    getShopCategories()
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasNext) fetchShops(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops(1, false);
  };

  /**
   * One line saying what the list actually is, so a widened radius is stated
   * rather than implied. Silence here is how "these are all far away" becomes
   * "there are no shops".
   */
  const scopeLine = (() => {
    if (loading || shops.length === 0) return null;
    if (scope?.applied && scope.radius_km) {
      return `${shops.length === 1 ? "1 shop" : `${shops.length} shops`} within ${scope.radius_km} km`;
    }
    if (sortBy === "nearby" && !scope?.applied) {
      return location
        ? "Nothing close by — showing shops everywhere"
        : "Set your location to see what's nearby";
    }
    return null;
  })();

  const Chip = ({
    label,
    active,
    onPress,
    tone = "primary",
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    tone?: "primary" | "neutral";
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={`h-9 items-center justify-center rounded-full px-4 ${
        active
          ? tone === "primary"
            ? "bg-primary-fill"
            : "bg-text-primary"
          : "bg-surface-sunken"
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          active
            ? tone === "primary"
              ? "text-text-on-primary"
              : "text-text-on-primary"
            : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top"]}>
      {/* Header: where you are, not what the screen is called. The title was
          the most prominent thing on a screen whose whole job is showing
          things near you. */}
      <View className="flex-row items-center gap-1 px-4 pt-1 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={t.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Shops near
          </Text>
          <LocationSwitcher compact />
        </View>
      </View>

      <View className="mx-4 mb-3 h-12 flex-row items-center rounded-xl px-4 bg-surface-sunken">
        <Search size={19} color={t.textSecondary} />
        <TextInput
          className="ml-3 flex-1 text-[15px] text-text-primary"
          placeholder="Search shops"
          placeholderTextColor={t.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Sort, then categories, on one rail — two stacked rails ate a third of
          the screen before a single shop appeared. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 8,
          alignItems: "center",
        }}
      >
        <SlidersHorizontal size={14} color={t.textMuted} strokeWidth={2} />
        {SORTS.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            tone="neutral"
            active={sortBy === key}
            onPress={() => setSortBy(key)}
          />
        ))}

        {categories.length > 0 ? <View className="mx-1 h-5 w-px bg-border" /> : null}

        {categories.length > 0 ? (
          <Chip
            label="All"
            active={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
        ) : null}
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={selectedCategory === c.slug}
            onPress={() =>
              setSelectedCategory(selectedCategory === c.slug ? null : c.slug)
            }
          />
        ))}
      </ScrollView>

      {scopeLine ? (
        <Text className="px-4 pb-2 text-[12px] text-text-muted">{scopeLine}</Text>
      ) : null}

      {loading ? (
        // Skeletons rather than a spinner: the shape of what is coming is
        // itself information, and it stops the list jumping when it lands.
        <View className="px-4">
          {[0, 1, 2].map((i) => (
            <ProductSkeletonRow key={i} />
          ))}
        </View>
      ) : shops.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-center text-[17px] font-bold text-text-primary">
            No shops here yet
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-text-secondary">
            {search || selectedCategory
              ? "Try a different search, or clear the filters."
              : "Try widening your area, or check back soon."}
          </Text>
          {search || selectedCategory ? (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
              className="mt-5 h-10 items-center justify-center rounded-full px-5 bg-surface-sunken"
            >
              <Text className="text-[13px] font-semibold text-text-primary">
                Clear filters
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => router.push(`/shopDetails/${item.id}`)}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.textSecondary}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color={t.textSecondary} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
