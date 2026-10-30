/**
 * Your products, and which carry business terms. Products without terms still
 * sell on Markt as usual; terms are what make them findable by businesses.
 */
import React, { useCallback, useState } from "react";
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Package, Plus } from "lucide-react-native";
import ScreenHeader from "../../../components/ScreenHeader";
import { Badge, EmptyState, Loading } from "../../../components/business/ui";
import { useBusiness } from "../../../hooks/businessContext";
import { useUser } from "../../../hooks/userContextProvider";
import { useTokens } from "../../../theme/useTokens";
import { getMyProductsPage } from "../../../services/sections/product";
import { searchListings } from "../../../services/sections/business";
import { formatNaira } from "../../../utils/formatCurrency";
import { formatQuantity, type BusinessListing } from "../../../models/business";
import type { ProductResponse } from "../../../models/products";

function imageOf(p: ProductResponse): string | undefined {
  const img = p.images?.[0] as { media?: { thumbnail_url?: string; mobile_url?: string; original_url?: string } } | undefined;
  return img?.media?.thumbnail_url ?? img?.media?.mobile_url ?? img?.media?.original_url;
}

export default function BusinessProductsScreen() {
  const router = useRouter();
  const t = useTokens();
  const { profile: user } = useUser();
  const { config } = useBusiness();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [terms, setTerms] = useState<Map<string, BusinessListing>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      // One call for every listing's terms rather than one per product.
      const [mine, listed] = await Promise.all([
        getMyProductsPage(1, 50),
        user?.id ? searchListings({ sellerUserId: user.id, perPage: 100 }) : Promise.resolve(null),
      ]);
      setProducts(mine.items.filter((p) => p.status !== "deleted"));
      setTerms(new Map((listed?.items ?? []).map((l) => [l.id, l.business_listing])));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const listedCount = products.filter((p) => terms.has(p.id)).length;

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader
        title="Products"
        fallback="/business"
        right={
          user?.is_seller ? (
            <TouchableOpacity onPress={() => router.push("/business/products/new")} accessibilityLabel="Add a product" className="w-10 h-10 items-center justify-center">
              <Plus size={22} color={t.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          ) : undefined
        }
      />
      {!user?.is_seller ? (
        <EmptyState
          icon={Package}
          title="Listing products needs a seller account"
          message="Add one from your Profile — it uses the same login."
          action="Go to Profile"
          onAction={() => router.push("/(tabs)/profile")}
        />
      ) : (
        <FlatList
          data={loading ? [] : products}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={t.textSecondary} />}
          ListHeaderComponent={
            !loading && products.length > 0 ? (
              <Text className="px-4 pt-4 pb-2 text-[13px] text-text-secondary">
                {listedCount} of {products.length} listed for businesses. Add business terms to the products you want
                businesses to find.
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <Loading />
            ) : error ? (
              <EmptyState icon={Package} title="Couldn't load your products" action="Try again" onAction={load} />
            ) : (
              <EmptyState icon={Package} title="No products yet" action="Add your first product" onAction={() => router.push("/business/products/new")} />
            )
          }
          renderItem={({ item }) => {
            const listing = terms.get(item.id);
            const uri = imageOf(item);
            return (
              <TouchableOpacity
                onPress={() => router.push(`/business/products/${item.id}`)}
                activeOpacity={0.8}
                className="flex-row items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised"
              >
                {uri ? (
                  <Image source={{ uri }} className="w-14 h-14 rounded-xl bg-surface-sunken" />
                ) : (
                  <View className="w-14 h-14 rounded-xl items-center justify-center bg-surface-sunken">
                    <Package size={20} color={t.textMuted} strokeWidth={1.8} />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-text-primary" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-text-secondary" numberOfLines={1}>
                    {listing
                      ? [
                          listing.available_quantity != null ? `${formatQuantity(listing.available_quantity, listing.unit, config.units)} available` : "",
                          listing.price_negotiable ? "negotiable" : "",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Business terms set"
                      : item.status && item.status !== "active"
                        ? `${item.status.replace(/_/g, " ")} · not visible to businesses`
                        : "No business terms yet"}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-[13px] font-bold text-text-primary">{formatNaira(item.price)}</Text>
                  <Badge label={listing ? "Listed" : "Add terms"} tone={listing ? "success" : "muted"} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
