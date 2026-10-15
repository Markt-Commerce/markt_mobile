import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, WifiOff } from "lucide-react-native";
import ProductDisplayComponent from "../components/productDisplayComponent";
import FeedPostCard from "../components/FeedPostCard";
import { getNearby, scopeNotice, type NearbyFeed } from "../services/sections/location";
import { getProductById } from "../services/sections/product";
import { getPublicPosts } from "../services/sections/feed";
import { useBrowseLocation } from "../hooks/browseLocationContext";
import LocationSwitcher from "../components/location/LocationSwitcher";
import { ProductSkeletonRow } from "../components/SkeletonBlock";
import { useTokens } from "../theme/useTokens";
import { useAddToCart } from "../hooks/useAddToCart";
import CartFab from "../components/CartFab";
import type { Product as FeedProduct } from "../models/feed";
import type { ProductResponse } from "../models/products";
import type { FeedPost } from "../types/feed";
import { EmptyStall } from "../components/illustrations/MarktIllustration";
import { useBackTo } from "../utils/goBack";

type Tab = "products" | "posts";
type LoadState = "loading" | "ready" | "error";

const POSTS_PER_PAGE = 10;

/**
 * Browse without an account.
 *
 * The old flow put six screens and sixteen fields between opening the app and
 * seeing a single price. `GET /products/` needs no session, so this shows the
 * real catalogue — not a mock, not a screenshot — and asks for an account only
 * when the user does something that genuinely needs one.
 *
 * Posts are here too, view-only: the post list is public, but liking,
 * commenting, saving and sharing all need an account.
 *
 * Every state is handled: loading, empty, offline, and a persistent join bar
 * that never blocks the content behind it.
 */
export default function Browse() {
  const router = useRouter();
  const goBack = useBackTo("/introduction");
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const { add: addProductToCart, addingId } = useAddToCart();
  const { location, guestId } = useBrowseLocation();
  const [tab, setTab] = useState<Tab>("products");

  // --- Products -------------------------------------------------------------
  const [items, setItems] = useState<ProductResponse[]>([]);
  const [feed, setFeed] = useState<Pick<NearbyFeed, "scope" | "radius_km"> | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);
  // Guards the image fill below against a newer load finishing first.
  const loadSeq = useRef(0);

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      const seq = ++loadSeq.current;
      if (opts?.refresh) setRefreshing(true);
      else setState("loading");
      try {
        const res = await getNearby({
          latitude: location?.latitude,
          longitude: location?.longitude,
          guestId: guestId ?? undefined,
          limit: 20,
        });
        if (seq !== loadSeq.current) return;
        // The nearby feed returns a lean row (id, name, price) with no
        // images, so the tiles render on that first...
        const lean = (res.items ?? []).map(
          (i) => ({ id: i.id, name: i.name, price: i.price ?? 0 }) as ProductResponse
        );
        setItems(lean);
        setFeed({ scope: res.scope, radius_km: res.radius_km });
        setState("ready");

        // ...and each is then filled in from its public detail record, which
        // carries the pictures. One failing leaves that tile as it was.
        const details = await Promise.all(
          lean.map((p) => getProductById(p.id).catch(() => null))
        );
        if (seq !== loadSeq.current) return;
        setItems(
          lean.map((p, i) =>
            details[i]
              ? ({ ...p, ...(details[i] as unknown as ProductResponse) } as ProductResponse)
              : p
          )
        );
      } catch {
        if (seq === loadSeq.current) setState("error");
      } finally {
        if (seq === loadSeq.current) setRefreshing(false);
      }
    },
    [location?.latitude, location?.longitude, guestId]
  );

  // Re-runs whenever the browse location changes, which is what makes the
  // header switcher re-scope the feed.
  useEffect(() => {
    load();
  }, [load]);

  // --- Posts ----------------------------------------------------------------
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsState, setPostsState] = useState<LoadState>("loading");
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const postsPage = useRef(1);
  const postsHasMore = useRef(true);
  const postsStarted = useRef(false);

  const loadPosts = useCallback(async (mode: "initial" | "refresh" | "more") => {
    if (mode === "more" && (!postsHasMore.current || postsLoadingMore)) return;
    if (mode === "initial") setPostsState("loading");
    if (mode === "refresh") setPostsRefreshing(true);
    if (mode === "more") setPostsLoadingMore(true);
    const page = mode === "more" ? postsPage.current + 1 : 1;
    try {
      const res = await getPublicPosts(page, POSTS_PER_PAGE);
      postsPage.current = page;
      postsHasMore.current = res.hasMore;
      setPosts((prev) => {
        if (page === 1) return res.items;
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.items.filter((p) => !seen.has(p.id))];
      });
      setPostsState("ready");
    } catch {
      // A failed next page keeps what is already on screen.
      if (mode !== "more") setPostsState("error");
    } finally {
      setPostsRefreshing(false);
      setPostsLoadingMore(false);
    }
  }, [postsLoadingMore]);

  // Only fetched once someone opens the tab.
  useEffect(() => {
    if (tab === "posts" && !postsStarted.current) {
      postsStarted.current = true;
      loadPosts("initial");
    }
  }, [tab, loadPosts]);

  // Two per row, matching the seller profile grid.
  const rows: ProductResponse[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  const errorState = (retry: () => void, what: string) => (
    <View className="flex-1 items-center justify-center px-10">
      <WifiOff size={40} color={t.textMuted} strokeWidth={1.5} />
      <Text className="text-[17px] font-bold mt-4 text-center text-text-primary">
        Can't load {what}
      </Text>
      <Text className="text-sm mt-2 text-center text-text-secondary">
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        className="h-11 px-6 rounded mt-5 items-center justify-center bg-primary-fill"
      >
        <Text className="font-bold text-text-on-primary">Try again</Text>
      </Pressable>
    </View>
  );

  const emptyState = (title: string, body: string, label: string) => (
    <View className="flex-1 items-center justify-center px-10">
      <EmptyStall size={104} label={label} />
      <Text className="text-[17px] font-bold mt-4 text-center text-text-primary">{title}</Text>
      <Text className="text-sm mt-2 text-center text-text-secondary">{body}</Text>
    </View>
  );

  const skeleton = (
    // Skeletons in the shape of the real grid, so the layout does not jump
    // when content lands.
    <View>
      <ProductSkeletonRow />
      <ProductSkeletonRow />
      <ProductSkeletonRow />
    </View>
  );

  const productsView =
    state === "loading" ? (
      skeleton
    ) : state === "error" ? (
      errorState(() => load(), "products")
    ) : items.length === 0 ? (
      emptyState(
        "Nothing listed yet",
        "New products show up here as sellers add them.",
        "No products listed yet"
      )
    ) : (
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ProductDisplayComponent
            onAdd={addProductToCart}
            addingId={addingId}
            // The tile carries no seller user id, so a room cannot be
            // resolved from here. Opening the product is where chat has
            // the context to work, and beats a button that does nothing.
            onChat={(p) => router.push(`/productDetails/${p.id}` as any)}
            // ProductDisplayComponent renders the feed's Product shape; the
            // catalogue endpoint returns ProductResponse. Only the fields the
            // tile actually reads are mapped, so a change to either type
            // surfaces here rather than being hidden by a blanket cast.
            products={item.map(
              (p): FeedProduct =>
                ({
                  ...p,
                  description: p.description ?? "",
                  compare_at_price: p.compare_at_price ?? p.price,
                  stock: p.stock ?? 0,
                  average_rating: p.average_rating ?? 0,
                }) as unknown as FeedProduct
            )}
          />
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true })}
            tintColor={t.primaryText}
          />
        }
      />
    );

  const postsView =
    postsState === "loading" ? (
      skeleton
    ) : postsState === "error" ? (
      errorState(() => loadPosts("initial"), "posts")
    ) : posts.length === 0 ? (
      emptyState("No posts yet", "Posts from sellers and buyers show up here.", "No posts yet")
    ) : (
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <FeedPostCard post={item} readOnly />}
        onEndReached={() => loadPosts("more")}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          postsLoadingMore ? (
            <View className="py-4">
              <ActivityIndicator size="small" color={t.textMuted} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={postsRefreshing}
            onRefresh={() => loadPosts("refresh")}
            tintColor={t.primaryText}
          />
        }
      />
    );

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right"]}>
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 items-center justify-center rounded"
        >
          <ArrowLeft size={22} color={t.textPrimary} />
        </Pressable>
        <View className="flex-1">
          <LocationSwitcher compact />
        </View>
      </View>

      <View className="flex-row px-4 pt-3 pb-2 gap-2" accessibilityRole="tablist">
        {(["products", "posts"] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`h-9 px-4 rounded-full items-center justify-center border ${active ? "bg-primary-fill border-primary" : "bg-surface-raised border-border"}`}
            >
              <Text className={`text-sm font-semibold ${active ? "text-text-on-primary" : "text-text-secondary"}`}>
                {key === "products" ? "Products" : "Posts"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Never present a distant result as though it were close. */}
      {tab === "products" && state === "ready" && feed && scopeNotice(feed) ? (
        <View className="px-4 py-2.5 bg-surface-sunken">
          <Text className="text-[12px] text-text-secondary">{scopeNotice(feed)}</Text>
        </View>
      ) : null}

      {tab === "products" ? productsView : postsView}

      {/* Anchored, not modal: it never blocks what the user came to see. */}
      <View
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 border-t border-border bg-surface-overlay"
        // Was pb-7 (28px). Android's navigation bar is taller than that, so
        // the sign-up button it anchors sat underneath the system keys.
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 16 }}
      >
        <Text className="text-[13px] text-center mb-2.5 text-text-secondary">
          Create an account to buy, chat, and save what you like.
        </Text>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Join Markt"
          className="h-12 rounded items-center justify-center bg-primary-fill"
        >
          <Text className="text-[16px] font-bold text-text-on-primary">Join Markt</Text>
        </Pressable>
      </View>
      <CartFab />
    </SafeAreaView>
  );
}
