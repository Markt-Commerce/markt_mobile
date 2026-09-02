/**
 * Saved — posts you kept and products you wishlisted, newest first.
 *
 * One list rather than two tabs by default: the feed mixes both, so splitting
 * them here would make you guess which tab a thing landed in. The filter is
 * there when you do know, and hides itself when you have only one kind.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Bookmark, Compass, RotateCw } from "lucide-react-native";
import ScreenHeader from "../components/ScreenHeader";
import SkeletonImage from "../components/SkeletonImage";
import { useTheme } from "../components/themeProvider";
import { useToast } from "../components/ToastProvider";
import { formatNaira } from "../utils/formatCurrency";
import { friendlyErrorMessage } from "../utils/errorMessages";
import { listSaved, unsaveItem, type SavedItem, type SavedType } from "../services/sections/saved";

const PER_PAGE = 20;
const FILTERS: { key: SavedType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "product", label: "Products" },
  { key: "post", label: "Posts" },
];

export default function SavedScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();

  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<SavedType | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ink = isDark ? "text-[#f0f1f2]" : "text-black";
  const muted = isDark ? "text-[#c6c5cf]" : "text-tertiary";
  const rule = isDark ? "border-[#46464e]" : "border-border";

  const load = useCallback(
    async (opts: { refresh?: boolean; forFilter?: SavedType | "all" } = {}) => {
      const active = opts.forFilter ?? filter;
      if (opts.refresh) setRefreshing(true);
      setError(null);
      try {
        const res = await listSaved(
          1,
          PER_PAGE,
          active === "all" ? undefined : active
        );
        setItems(res.items);
        setPage(1);
        setTotalPages(res.pagination.total_pages || 1);
      } catch (e) {
        if ((e as { status?: number })?.status !== 401) {
          setError(
            friendlyErrorMessage(e, "We couldn't load your saved items just now.")
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || refreshing || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listSaved(
        next,
        PER_PAGE,
        filter === "all" ? undefined : filter
      );
      const seen = new Set(items.map((i) => `${i.content_type}:${i.content_id}`));
      setItems((prev) => [
        ...prev,
        ...res.items.filter((i) => !seen.has(`${i.content_type}:${i.content_id}`)),
      ]);
      setPage(next);
      setTotalPages(res.pagination.total_pages || next);
    } catch {
      // The list already has content; failing quietly beats a banner here.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, refreshing, page, totalPages, filter, items]);

  const handleOpen = (item: SavedItem) => {
    router.push(
      item.content_type === "product"
        ? `/productDetails/${item.content_id}`
        : `/postDetails/${item.content_id}`
    );
  };

  const handleRemove = async (item: SavedItem) => {
    const key = `${item.content_type}:${item.content_id}`;
    const snapshot = items;
    setItems((prev) =>
      prev.filter((i) => `${i.content_type}:${i.content_id}` !== key)
    );
    try {
      await unsaveItem(item.content_type, item.content_id);
    } catch (e) {
      setItems(snapshot); // put it back rather than lie about it
      show({
        variant: "error",
        title: "Couldn't remove that",
        message: friendlyErrorMessage(e, "Try again in a moment."),
      });
    }
  };

  const showFilters = useMemo(
    () => filter !== "all" || items.some((i) => i.content_type === "post")
      ? items.length > 0 || filter !== "all"
      : false,
    [items, filter]
  );

  const renderItem = ({ item }: { item: SavedItem }) => (
    <Pressable
      onPress={() => handleOpen(item)}
      className={`flex-row items-center gap-4 px-6 py-4 border-b ${rule}`}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title ?? item.content_type}`}
    >
      <View
        className={`w-16 h-16 rounded overflow-hidden ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
      >
        {item.image_url ? (
          <SkeletonImage
            source={{ uri: item.image_url }}
            containerClassName="w-full h-full"
            resizeMode="cover"
            accessibilityLabel=""
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Bookmark size={20} color={isDark ? "#6b6b73" : "#A1A1AA"} />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className={`text-[15px] font-semibold ${ink}`} numberOfLines={2}>
          {item.title?.trim() || (item.content_type === "post" ? "Post" : "Product")}
        </Text>
        <Text className={`text-[13px] mt-1 ${muted}`}>
          {item.content_type === "product" && item.price != null
            ? formatNaira(item.price)
            : item.content_type === "product"
              ? "Product"
              : "Post"}
        </Text>
      </View>

      <Pressable
        onPress={() => handleRemove(item)}
        hitSlop={10}
        className="w-11 h-11 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.title ?? "this item"} from saved`}
      >
        <Bookmark size={20} color="#E94C2A" fill="#E94C2A" />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Saved" onBack={() => router.back()} />

      {showFilters ? (
        <View className={`flex-row gap-2 px-6 py-3 border-b ${rule}`}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  setFilter(f.key);
                  setLoading(true);
                  load({ forFilter: f.key });
                }}
                className={`px-4 min-h-[36px] justify-center rounded-full ${active ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Show ${f.label.toLowerCase()}`}
              >
                <Text
                  className={`font-bold text-[11px] tracking-[1.5px] uppercase ${active ? "text-white" : muted}`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94C2A" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className={`text-[15px] text-center leading-6 ${ink}`}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            className="mt-6 h-12 px-8 rounded bg-primary items-center justify-center flex-row gap-2"
            accessibilityRole="button"
            accessibilityLabel="Try loading your saved items again"
          >
            <RotateCw size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => `${i.content_type}:${i.content_id}`}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ refresh: true })}
              tintColor="#E94C2A"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#E94C2A" />
              </View>
            ) : (
              <View className="h-8" />
            )
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-10 pt-24">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              >
                <Bookmark size={30} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1.6} />
              </View>
              <Text className={`text-xl font-bold text-center ${ink}`}>
                {filter === "all" ? "Nothing saved yet" : "Nothing here yet"}
              </Text>
              <Text className={`text-[15px] mt-2 text-center leading-6 ${muted}`}>
                Tap the “…” on anything in your feed and choose Save. It'll be
                waiting here.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)")}
                className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center flex-row gap-2"
                accessibilityRole="button"
                accessibilityLabel="Browse the feed"
              >
                <Compass size={16} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                  Browse feed
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
