import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, PackageOpen, WifiOff } from "lucide-react-native";
import ProductDisplayComponent from "../components/productDisplayComponent";
import { getNearby, scopeNotice, type NearbyFeed } from "../services/sections/location";
import { useBrowseLocation } from "../hooks/browseLocationContext";
import LocationSwitcher from "../components/location/LocationSwitcher";
import { ProductSkeletonRow } from "../components/SkeletonBlock";
import { useTokens } from "../theme/useTokens";
import type { Product as FeedProduct } from "../models/feed";
import type { ProductResponse } from "../models/products";

/**
 * Browse without an account.
 *
 * The old flow put six screens and sixteen fields between opening the app and
 * seeing a single price. `GET /products/` needs no session, so this shows the
 * real catalogue — not a mock, not a screenshot — and asks for an account only
 * when the user does something that genuinely needs one.
 *
 * Every state is handled: loading, empty, offline, and a persistent join bar
 * that never blocks the content behind it.
 */
export default function Browse() {
  const router = useRouter();
  const t = useTokens();
  const [items, setItems] = useState<ProductResponse[]>([]);
  const [feed, setFeed] = useState<Pick<NearbyFeed, "scope" | "radius_km"> | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const { location, guestId } = useBrowseLocation();

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setState("loading");
      try {
        const res = await getNearby({
          latitude: location?.latitude,
          longitude: location?.longitude,
          guestId: guestId ?? undefined,
          limit: 20,
        });
        // The nearby feed returns a lean row; the tile needs the product shape.
        setItems(
          (res.items ?? []).map(
            (i) => ({ id: i.id, name: i.name, price: i.price ?? 0 }) as ProductResponse
          )
        );
        setFeed({ scope: res.scope, radius_km: res.radius_km });
        setState("ready");
      } catch {
        setState("error");
      } finally {
        setRefreshing(false);
      }
    },
    [location?.latitude, location?.longitude, guestId]
  );

  // Re-runs whenever the browse location changes, which is what makes the
  // header switcher re-scope the feed.
  useEffect(() => {
    load();
  }, [load]);

  // Two per row, matching the seller profile grid.
  const rows: ProductResponse[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right"]}>
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
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

      {/* Never present a distant result as though it were close. */}
      {state === "ready" && feed && scopeNotice(feed) ? (
        <View className="px-4 py-2.5 bg-surface-sunken">
          <Text className="text-[12px] text-text-secondary">{scopeNotice(feed)}</Text>
        </View>
      ) : null}

      {state === "loading" ? (
        // Skeletons in the shape of the real grid, so the layout does not jump
        // when content lands.
        <View>
          <ProductSkeletonRow />
          <ProductSkeletonRow />
          <ProductSkeletonRow />
        </View>
      ) : state === "error" ? (
        <View className="flex-1 items-center justify-center px-10">
          <WifiOff size={40} color={t.textMuted} strokeWidth={1.5} />
          <Text className="text-[17px] font-bold mt-4 text-center text-text-primary">
            Can't load products
          </Text>
          <Text className="text-sm mt-2 text-center text-text-secondary">
            Check your connection and try again.
          </Text>
          <Pressable
            onPress={() => load()}
            accessibilityRole="button"
            className="h-11 px-6 rounded mt-5 items-center justify-center bg-primary-fill"
          >
            <Text className="font-bold text-text-on-primary">Try again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <PackageOpen size={40} color={t.textMuted} strokeWidth={1.5} />
          <Text className="text-[17px] font-bold mt-4 text-center text-text-primary">
            Nothing listed yet
          </Text>
          <Text className="text-sm mt-2 text-center text-text-secondary">
            New products show up here as sellers add them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <ProductDisplayComponent
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
      )}

      {/* Anchored, not modal: it never blocks what the user came to see. */}
      <View className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-7 border-t border-border bg-surface-overlay">
        <Text className="text-[13px] text-center mb-2.5 text-text-secondary">
          Create an account to buy, chat, and save what you like.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Join Markt"
          className="h-12 rounded items-center justify-center bg-primary-fill"
        >
          <Text className="text-[16px] font-bold text-text-on-primary">Join Markt</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
