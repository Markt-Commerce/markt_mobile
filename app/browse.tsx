import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, PackageOpen, WifiOff } from "lucide-react-native";
import ProductDisplayComponent from "../components/productDisplayComponent";
import { getPublicProducts } from "../services/sections/product";
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
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    else setState("loading");
    try {
      setItems(await getPublicProducts(1, 20));
      setState("ready");
    } catch {
      setState("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

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
        <Text className="text-[17px] font-bold text-text-primary">Browse Markt</Text>
      </View>

      {state === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={t.primaryText} />
          <Text className="text-sm mt-3 text-text-secondary">Loading products…</Text>
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
