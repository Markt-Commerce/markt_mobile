/**
 * Market detail — tabbed browse of a market's sellers, products, and posts.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getMarket,
  getMarketSellers,
  getMarketProducts,
  getMarketPosts,
} from "../../services/sections/markets";
import type { Market } from "../../services/sections/markets";
import type { ShopLite } from "../../services/sections/shops";
import type { Product, Post } from "../../models/feed";
import Avatar from "../../components/Avatar";
import ProductDisplayComponent from "../../components/productDisplayComponent";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import { useTheme } from "../../components/themeProvider";

type Tab = "sellers" | "products" | "posts";

function groupPairs<T>(items: T[]): T[][] {
  const grouped: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    grouped.push(items.slice(i, i + 2));
  }
  return grouped;
}

function SellerRow({
  seller,
  onPress,
  isDark,
}: {
  seller: ShopLite;
  onPress: () => void;
  isDark: boolean;
}) {
  const label = seller.shop_name || seller.user?.username || "Shop";
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-6 py-4 border-b ${isDark ? "bg-dark-page border-dark-border" : "bg-white border-border"}`}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${label}`}
    >
      <Avatar uri={seller.user?.profile_picture} name={label} size={48} />
      <View className="flex-1 ml-4">
        <Text
          className={`font-geist font-bold text-base ${isDark ? "text-dark-text" : "text-black"}`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {seller.stats && (
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} font-inter text-xs mt-1`}
          >
            {seller.stats.product_count} products · {seller.stats.follower_count}{" "}
            followers
          </Text>
        )}
      </View>
      {seller.verification_status === "verified" && (
        <View
          className={`px-2 py-0.5 rounded ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
        >
          <Text
            className={`${isDark ? "text-dark-muted" : "text-tertiary"} font-geist font-medium text-[10px] uppercase tracking-wider`}
          >
            Verified
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MarketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [market, setMarket] = useState<Market | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("sellers");

  const [sellers, setSellers] = useState<ShopLite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasNext, setHasNext] = useState<Record<Tab, boolean>>({
    sellers: false,
    products: false,
    posts: false,
  });
  const [page, setPage] = useState<Record<Tab, number>>({
    sellers: 1,
    products: 1,
    posts: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchedTabs, setFetchedTabs] = useState<Set<Tab>>(new Set());

  useEffect(() => {
    if (!id) return;
    getMarket(id)
      .then(setMarket)
      .catch(() => setMarket(null));
  }, [id]);

  const fetchTab = useCallback(
    async (tab: Tab, p: number, append: boolean) => {
      if (!id) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        if (tab === "sellers") {
          const res = await getMarketSellers(id, { page: p, per_page: 20 });
          setSellers((prev) => (append ? [...prev, ...(res.shops ?? [])] : res.shops ?? []));
          setHasNext((prev) => ({ ...prev, sellers: res.pagination?.has_next ?? false }));
        } else if (tab === "products") {
          const res = await getMarketProducts(id, { page: p, per_page: 20 });
          setProducts((prev) => (append ? [...prev, ...(res.items ?? [])] : res.items ?? []));
          setHasNext((prev) => ({ ...prev, products: res.pagination?.has_next ?? false }));
        } else {
          const res = await getMarketPosts(id, { page: p, per_page: 20 });
          setPosts((prev) => (append ? [...prev, ...(res.items ?? [])] : res.items ?? []));
          setHasNext((prev) => ({ ...prev, posts: res.pagination?.has_next ?? false }));
        }
        setPage((prev) => ({ ...prev, [tab]: p }));
        setFetchedTabs((prev) => new Set(prev).add(tab));
      } catch {
        // leave existing state — the empty/error state below covers first-load failures
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!fetchedTabs.has(activeTab)) fetchTab(activeTab, 1, false);
  }, [activeTab, fetchedTabs, fetchTab]);

  const loadMore = () => {
    if (loadingMore || !hasNext[activeTab]) return;
    fetchTab(activeTab, page[activeTab] + 1, true);
  };

  const tabLabel: Record<Tab, string> = {
    sellers: "Sellers",
    products: "Products",
    posts: "Posts",
  };

  const showLoading = loading && !fetchedTabs.has(activeTab);

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
          className={`flex-1 text-xl font-geist font-bold text-center pr-8 ${isDark ? "text-dark-text" : "text-black"}`}
          numberOfLines={1}
        >
          {market?.name ?? "Market"}
        </Text>
      </View>

      <View
        className={`flex-row border-b px-6 gap-8 ${isDark ? "border-dark-border" : "border-border"}`}
      >
        {(["sellers", "products", "posts"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`items-center border-b-[2px] pb-3 pt-4 ${activeTab === tab ? "border-primary" : "border-transparent"}`}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text
              className={`text-sm font-geist font-bold ${activeTab === tab ? (isDark ? "text-dark-text" : "text-black") : isDark ? "text-dark-muted" : "text-tertiary"}`}
            >
              {tabLabel[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showLoading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator
            size="large"
            color={isDark ? "#f5f5f5" : "#000000"}
          />
        </View>
      ) : activeTab === "sellers" ? (
        sellers.length === 0 ? (
          <EmptyState isDark={isDark} label="No sellers in this market yet." />
        ) : (
          <FlatList
            data={sellers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SellerRow
                seller={item}
                onPress={() => router.push(`/shopDetails/${item.id}`)}
                isDark={isDark}
              />
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={<LoadMoreFooter loading={loadingMore} isDark={isDark} />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )
      ) : activeTab === "products" ? (
        products.length === 0 ? (
          <EmptyState isDark={isDark} label="No products from this market yet." />
        ) : (
          <FlatList
            data={groupPairs(products)}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <ProductDisplayComponent products={item} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={<LoadMoreFooter loading={loadingMore} isDark={isDark} />}
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          />
        )
      ) : posts.length === 0 ? (
        <EmptyState isDark={isDark} label="No posts from this market yet." />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostDisplayComponent post={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<LoadMoreFooter loading={loadingMore} isDark={isDark} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState({ isDark, label }: { isDark: boolean; label: string }) {
  return (
    <View className="flex-1 justify-center items-center px-6 py-16">
      <Text
        className={`${isDark ? "text-dark-muted" : "text-tertiary"} text-sm text-center`}
      >
        {label}
      </Text>
    </View>
  );
}

function LoadMoreFooter({ loading, isDark }: { loading: boolean; isDark: boolean }) {
  if (!loading) return null;
  return (
    <View className="py-6 items-center">
      <ActivityIndicator size="small" color={isDark ? "#f5f5f5" : "#000000"} />
    </View>
  );
}
