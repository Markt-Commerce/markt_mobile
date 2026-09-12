import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { MapPin, Package, Star } from "lucide-react-native";
import Avatar from "../Avatar";
import VerifiedBadge, { isVerifiedSeller } from "../VerifiedBadge";
import type { ShopLite } from "../../services/sections/shops";
import { useTokens } from "../../theme/useTokens";

/**
 * A shop, as a card rather than a list row.
 *
 * The row it replaces was an avatar, a name and a line of grey text — the
 * same shape as a contact list, which told you nothing about whether a shop
 * was worth opening. A card gives the three things that actually decide that:
 * how far away it is, how well it is rated, and how much it has.
 *
 * Deliberately *not* a copy of the delivery-app card it is modelled on: that
 * one leads with a delivery fee and an ETA, and Markt sellers have neither.
 * Distance is the honest equivalent — it is real data, and it answers the
 * same question ("can I actually get this?").
 *
 * Every one of the three can be missing, and each is simply dropped when it
 * is. Most sellers have no coordinates yet, so a distance is often unknown —
 * and an unknown distance rendered as "0.0 km away" would be a lie the user
 * could act on.
 */
export default function ShopCard({
  shop,
  onPress,
}: {
  shop: ShopLite;
  onPress: () => void;
}) {
  const t = useTokens();
  const name = shop.shop_name || shop.user?.username || "Shop";
  const rating = shop.total_raters > 0 ? shop.average_rating : null;
  const products = shop.stats?.product_count ?? 0;
  const distance = typeof shop.distance_km === "number" ? shop.distance_km : null;

  const accessibilityLabel = [
    name,
    isVerifiedSeller(shop.verification_status) ? "verified" : null,
    rating !== null ? `rated ${rating.toFixed(1)} out of 5` : null,
    products > 0 ? `${products} products` : null,
    distance !== null ? `${formatDistance(distance)} away` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="mb-4 rounded-2xl overflow-hidden bg-surface-raised border border-border active:opacity-90"
    >
      {/* Cover. A tinted block rather than a grey rectangle when there is no
          image: an empty slot should still look designed. */}
      <View className="h-[104px] w-full bg-primary-muted">
        {shop.banner_url ? (
          <Image
            source={{ uri: shop.banner_url }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : null}
      </View>

      <View className="px-4 pb-4">
        {/* The avatar straddles the cover, which is what makes this read as a
            shop rather than a photo with a caption. */}
        <View className="-mt-8 mb-2 flex-row items-end justify-between">
          <View className="rounded-full border-4 border-surface-raised">
            <Avatar uri={shop.user?.profile_picture} name={name} size={56} />
          </View>

          {distance !== null ? (
            <View className="mb-1 flex-row items-center gap-1 rounded-full px-2.5 py-1 bg-surface-sunken">
              <MapPin size={12} color={t.textSecondary} strokeWidth={2.2} />
              <Text className="text-[12px] font-semibold text-text-secondary">
                {formatDistance(distance)}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-[16px] font-bold text-text-primary shrink"
            numberOfLines={1}
          >
            {name}
          </Text>
          {isVerifiedSeller(shop.verification_status) ? <VerifiedBadge /> : null}
        </View>

        {shop.description ? (
          <Text className="mt-1 text-[13px] leading-5 text-text-secondary" numberOfLines={2}>
            {shop.description}
          </Text>
        ) : null}

        <View className="mt-2.5 flex-row items-center gap-4">
          {rating !== null ? (
            <View className="flex-row items-center gap-1">
              <Star size={13} color={t.warningText} fill={t.warningText} />
              <Text className="text-[13px] font-semibold text-text-primary">
                {rating.toFixed(1)}
              </Text>
              <Text className="text-[12px] text-text-muted">
                ({shop.total_raters})
              </Text>
            </View>
          ) : (
            <Text className="text-[12px] text-text-muted">No ratings yet</Text>
          )}

          {products > 0 ? (
            <View className="flex-row items-center gap-1">
              <Package size={13} color={t.textMuted} strokeWidth={2} />
              <Text className="text-[12px] text-text-muted">
                {products} {products === 1 ? "item" : "items"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Under a kilometre reads in metres, rounded to 50 m — "0.4 km" is both less
 * legible and falsely precise for a walk down the road. Past 10 km the
 * decimal stops earning its place: nobody chooses differently between 29.7
 * and 30.
 *
 * The metres branch checks its own result rather than only the input, because
 * rounding 0.98 km to the nearest 50 m lands on 1000 — and "1000 m" is not a
 * thing anyone writes.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const metres = Math.max(50, Math.round((km * 1000) / 50) * 50);
    if (metres < 1000) return `${metres} m`;
  }
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
