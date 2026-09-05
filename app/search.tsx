// app/search.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Search, ChevronRight, ChevronLeft, Megaphone } from "lucide-react-native";
import { Link } from "expo-router";
import { debounce } from "lodash";
import { search } from "../services/sections/search";
import { SearchResponse } from "../models/search";
import ProductDisplayComponent from "../components/productDisplayComponent";
import PostDisplayComponent from "../components/PostDisplayComponent";
import BuyerRequestFormBottomSheet from "../components/buyerRequestBottomSheet";
import { defaultProfilePicture } from "../models/defaults";
import { useTheme } from "../components/themeProvider";
import { useUser } from "../hooks/userContextProvider";
import type { Product as FeedProduct } from "../models/feed";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

type SearchView = "all" | "sellers" | "products" | "posts";

/** Two-column rows for ProductDisplayComponent (same pattern as shopDetails). */
function chunkPairs<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>();
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState<SearchView>("all");
  // Filtered-view infinite scroll: next page to fetch + whether the backend
  // still has more of the active section. Ref-guarded — onScroll fires faster
  // than state flushes.
  const [loadingMore, setLoadingMore] = useState(false);
  const nextPageRef = useRef(2);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const requestFormRef = useRef<BottomSheetMethods>(null);

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults(undefined);
        setSearching(false);
        return;
      }
      try {
        const response = await search(q.trim(), 1);
        setResults(response);
      } catch {
        setResults(undefined);
      } finally {
        setSearching(false);
      }
    }, 350),
    [],
  );

  useEffect(() => {
    if (query.trim()) setSearching(true);
    else {
      setSearching(false);
      setView("all");
    }
    performSearch(query);
  }, [query]);

  // New query or section switch restarts filtered-view pagination.
  useEffect(() => {
    nextPageRef.current = 2;
    hasMoreRef.current = true;
  }, [query, view]);

  const loadMoreForView = async (activeView: SearchView) => {
    if (
      activeView === "all" ||
      loadingMoreRef.current ||
      !hasMoreRef.current ||
      !query.trim()
    )
      return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await search(query.trim(), nextPageRef.current);
      const incoming =
        activeView === "sellers"
          ? res.sellers
          : activeView === "products"
            ? res.products
            : res.posts;
      if (!incoming || incoming.length === 0) {
        hasMoreRef.current = false;
        return;
      }
      if (incoming.length < (res.per_page ?? 20)) hasMoreRef.current = false;
      nextPageRef.current += 1;
      setResults((prev) => {
        if (!prev) return res;
        const mergeById = <T extends { id: string | number }>(
          existing: T[],
          added: T[],
        ) => {
          const seen = new Set(existing.map((e) => String(e.id)));
          return [...existing, ...added.filter((a) => !seen.has(String(a.id)))];
        };
        return {
          ...prev,
          sellers:
            activeView === "sellers"
              ? mergeById(prev.sellers, res.sellers)
              : prev.sellers,
          products:
            activeView === "products"
              ? mergeById(prev.products, res.products)
              : prev.products,
          posts:
            activeView === "posts" ? mergeById(prev.posts, res.posts) : prev.posts,
        };
      });
    } catch {
      /* keep what we have; retry on next scroll */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  // "View all" needs a meaningful query — a single character just noise-matches.
  const viewAllEnabled = query.trim().length > 1;

  const sellers = results?.sellers ?? [];
  const products = results?.products ?? [];
  const posts = results?.posts ?? [];
  const nothingFound =
    !!results &&
    sellers.length === 0 &&
    products.length === 0 &&
    posts.length === 0;

  const sectionTitle: Record<Exclude<SearchView, "all">, string> = {
    sellers: "Sellers",
    products: "Products",
    posts: "Social Feed",
  };

  const headingColor = isDark ? "text-text-primary" : "text-black";
  const mutedColor = isDark ? "text-text-secondary" : "text-tertiary";
  const iconColor = isDark ? "#f0f1f2" : "#000000";
  const mutedIconColor = isDark ? "#c6c5cf" : "#A1A1AA";

  const renderViewAll = (target: Exclude<SearchView, "all">, label: string) => (
    <TouchableOpacity
      onPress={() => setView(target)}
      disabled={!viewAllEnabled}
      className={`flex-row items-center gap-2 ${viewAllEnabled ? "" : "opacity-30"}`}
    >
      <Text
        className={`font-bold text-[10px] tracking-widest uppercase ${headingColor}`}
      >
        {label}
      </Text>
      <ChevronRight size={14} color={iconColor} strokeWidth={2} />
    </TouchableOpacity>
  );

  const sellerCard = (item: SearchResponse["sellers"][number]) => (
    <Link key={item.id} href={`/shopDetails/${item.id}`} asChild>
      <TouchableOpacity activeOpacity={0.8} className="mb-4">
        <View
          className={`flex-row items-center gap-4 p-4 rounded border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-white border-border"}`}
        >
          <Image
            source={{ uri: item.profile_picture_url || defaultProfilePicture }}
            className={`w-14 h-14 rounded-full border ${isDark ? "bg-surface-raised border-border-strong" : "bg-surface border-border"}`}
          />
          <View className="flex-1">
            <Text
              className={`font-bold text-sm tracking-tight ${headingColor}`}
              numberOfLines={1}
            >
              {item.shop_name}
            </Text>
            <Text
              className={`font-bold text-[9px] tracking-widest uppercase mt-1.5 ${mutedColor}`}
            >
              {item.total_products
                ? `${item.total_products} product${item.total_products === 1 ? "" : "s"}`
                : "Curated Store"}
            </Text>
          </View>
          <ChevronRight size={20} color={iconColor} strokeWidth={1} />
        </View>
      </TouchableOpacity>
    </Link>
  );

  const productGrid = (items: SearchResponse["products"]) => (
    <View className="px-2">
      {chunkPairs(items).map((pair, idx) => (
        <ProductDisplayComponent
          key={pair[0]?.id ?? idx}
          products={pair as unknown as FeedProduct[]}
        />
      ))}
    </View>
  );

  const showSellers =
    (view === "all" || view === "sellers") && sellers.length > 0;
  const showProducts =
    (view === "all" || view === "products") && products.length > 0;
  const showPosts = (view === "all" || view === "posts") && posts.length > 0;
  const filteredViewEmpty =
    view !== "all" &&
    !!results &&
    ((view === "sellers" && sellers.length === 0) ||
      (view === "products" && products.length === 0) ||
      (view === "posts" && posts.length === 0));

  return (
    <SafeAreaView
      className="flex-1 bg-surface-page"
    >
      {/* Search Input */}
      <View
        className={`px-6 pt-6 pb-4 border-b ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-border"}`}
      >
        <View
          className={`h-14 px-5 flex-row items-center rounded border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
        >
          <Search size={20} color={iconColor} strokeWidth={1.5} />
          <TextInput
            className={`ml-4 flex-1 font-semibold text-base text-text-primary`}
            placeholder="Search products, sellers, posts…"
            placeholderTextColor={mutedIconColor}
            value={query}
            onChangeText={setQuery}
            selectionColor={iconColor}
          />
          {searching && <ActivityIndicator size="small" color={mutedIconColor} />}
        </View>

        {/* Buyer request shortcut — buyer mode only */}
        {role === "buyer" && (
          <TouchableOpacity
            onPress={() => requestFormRef.current?.expand()}
            activeOpacity={0.8}
            className={`mt-3 flex-row items-center gap-3 px-4 py-3 rounded border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
          >
            <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
              <Megaphone size={18} color="white" />
            </View>
            <Text className={`flex-1 text-xs leading-5 ${mutedColor}`}>
              Can't find it? Create a buyer request so sellers can message you
              about what you're looking for.
            </Text>
            <ChevronRight size={16} color={mutedIconColor} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Filtered view header */}
        {view !== "all" && (
          <View className="mt-3 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setView("all")}
              className={`flex-row items-center gap-1 px-3 py-1.5 rounded border ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
            >
              <ChevronLeft size={14} color={iconColor} strokeWidth={2} />
              <Text
                className={`font-bold text-[10px] tracking-widest uppercase ${headingColor}`}
              >
                All results
              </Text>
            </TouchableOpacity>
            <Text className={`flex-1 text-xs ${mutedColor}`} numberOfLines={1}>
              {sectionTitle[view]} for “{query.trim()}”
            </Text>
          </View>
        )}
      </View>

      {nothingFound && view === "all" ? (
        <View className="flex-1 justify-center items-center px-12">
          <View
            className="mb-6"
          >
            <Search size={44} color={mutedIconColor} strokeWidth={1.5} />
          </View>
          <Text
            className={`font-bold text-xl text-center leading-tight ${headingColor}`}
          >
            No results found
          </Text>
          <Text className={`text-center mt-4 leading-6 ${mutedColor}`}>
            Our search couldn't find a match for your query. Try different
            keywords or explore trending categories.
          </Text>
        </View>
      ) : filteredViewEmpty ? (
        <View className="flex-1 justify-center items-center px-12">
          <Text
            className={`font-bold text-base text-center ${headingColor}`}
          >
            No {sectionTitle[view as Exclude<SearchView, "all">].toLowerCase()}{" "}
            for “{query.trim()}”
          </Text>
          <Text className={`text-center mt-3 leading-6 ${mutedColor}`}>
            Try different keywords, or go back to all results.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={200}
          onScroll={({ nativeEvent }) => {
            if (view === "all") return;
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 300
            )
              loadMoreForView(view);
          }}
        >
          {/* Sellers Section */}
          {showSellers && (
            <View className="py-6">
              <View className="flex-row items-center justify-between mb-4 px-6">
                <Text
                  className={`font-bold text-xs tracking-[0.2em] uppercase ${headingColor}`}
                >
                  Sellers
                </Text>
                {view === "all" &&
                  sellers.length > 3 &&
                  renderViewAll("sellers", "View All")}
              </View>

              <View className="px-6">
                {(view === "sellers" ? sellers : sellers.slice(0, 3)).map(
                  sellerCard,
                )}
              </View>
            </View>
          )}

          {/* Products Section */}
          {showProducts && (
            <View
              className={`py-6 ${view === "all" && showSellers ? `border-t border-border-strong` : ""}`}
            >
              <View className="flex-row items-center justify-between mb-2 px-6">
                <Text
                  className={`font-bold text-xs tracking-[0.2em] uppercase ${headingColor}`}
                >
                  Products
                </Text>
                {view === "all" &&
                  products.length > 4 &&
                  renderViewAll("products", "View All")}
              </View>

              {productGrid(view === "products" ? products : products.slice(0, 4))}
            </View>
          )}

          {/* Posts Section */}
          {showPosts && (
            <View
              className={`py-6 ${view === "all" && (showSellers || showProducts) ? `border-t border-border-strong` : ""}`}
            >
              <View className="flex-row items-center justify-between mb-4 px-6">
                <Text
                  className={`font-bold text-xs tracking-[0.2em] uppercase ${headingColor}`}
                >
                  Social Feed
                </Text>
                {view === "all" &&
                  posts.length > 2 &&
                  renderViewAll("posts", "Explore Feed")}
              </View>

              <View className="px-6">
                {(view === "posts" ? posts : posts.slice(0, 2)).map((item) => (
                  <View key={item.id} className="mb-4">
                    <PostDisplayComponent post={item} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {loadingMore && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={mutedIconColor} />
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      )}

      {role === "buyer" && <BuyerRequestFormBottomSheet ref={requestFormRef} />}
    </SafeAreaView>
  );
}
