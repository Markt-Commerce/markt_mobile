/**
 * FeedProductCard — Renders a product in the hybrid feed.
 *
 * - View → product detail
 * - Add to cart (buyers)
 * - Message seller (buyers)
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { MessageCircle, MoreHorizontal, ShoppingCart, Tag } from "lucide-react-native";
import type { FeedProduct } from "../types/feed";
import { addToCart } from "../services/sections/cart";
import SkeletonImage from "./SkeletonImage";
import Avatar from "./Avatar";
import { useUser } from "../hooks/userContextProvider";
import { useToast } from "./ToastProvider";
import { useTheme } from "./themeProvider";
import { useGamificationLookup } from "../hooks/useGamificationLookup";
import TierBadge from "./gamification/TierBadge";
import BadgeChip from "./gamification/BadgeChip";

interface Props {
  product: FeedProduct;
  onMessageSeller?: (product: FeedProduct) => void;
  /** Opens the save / share / report / block sheet. Omit to hide the "…". */
  onOpenActions?: (product: FeedProduct) => void;
}

function compactAge(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

function FeedProductCard({ product, onMessageSeller, onOpenActions }: Props) {
  const router = useRouter();
  const { role, user } = useUser();
  const isOwnProduct = user?.user_id && product.seller?.user?.id && product.seller.user.id === user.user_id;
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [isFollowing, setIsFollowing] = useState(product.seller?.is_followed ?? false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const followeeId = product.seller?.user?.id;
  const followerCount = product.seller?.follower_count ?? 0;
  const { profile: sellerGamification } = useGamificationLookup(followeeId);
  const topBadges = useMemo(
    () =>
      [...(sellerGamification?.badges ?? [])]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2),
    [sellerGamification]
  );

  // Follow state can change elsewhere (seller profile, another card for the
  // same seller); re-seed from the refreshed payload rather than staying on
  // whatever was true at mount.
  useEffect(() => {
    setIsFollowing(product.seller?.is_followed ?? false);
  }, [product.seller?.user?.id, product.seller?.is_followed]);

  const imageUrl = product.images?.[0]?.url;
  const isBuyer = role === "buyer";

  const handleAddToCart = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addToCart({
        product_id: product.id,
        quantity: 1,
        variant_id: 0,
      });
      show({
        variant: "success",
        title: "Added to cart",
        message: `${product.name} has been added to your cart.`,
      });
    } catch {
      show({
        variant: "error",
        title: "Could not add to cart",
        message: "Please sign in as a buyer and try again.",
      });
    } finally {
      setAdding(false);
    }
  }, [adding, product.id, product.name, show]);

  const handleMessageSeller = useCallback(() => {
    onMessageSeller?.(product);
  }, [onMessageSeller, product]);

  const handleOpenActions = useCallback(() => {
    onOpenActions?.(product);
  }, [onOpenActions, product]);

  const handleOpenShop = useCallback(() => {
    if (!product.seller?.id) return;
    router.push(`/shopDetails/${product.seller.id}`);
  }, [router, product.seller?.id]);

  return (
    <View className={`flex-row px-4 py-3 border-b ${isDark ? "bg-[#1a1c1d] border-[#34363a]" : "bg-white border-border"}`}>
      <Pressable
        onPress={handleOpenShop}
        disabled={!product.seller?.id}
        className="mr-3 self-start"
        accessibilityRole="link"
        accessibilityLabel={`View ${product.seller?.shop_name ?? "seller"}'s shop`}
      >
        <Avatar
          uri={product.seller?.user?.profile_picture}
          name={product.seller?.shop_name ?? product.seller?.user?.username}
          size={42}
        />
      </Pressable>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center min-h-[22px] mb-0.5">
          <Pressable onPress={handleOpenShop} disabled={!product.seller?.id} className="flex-row items-center flex-shrink gap-1.5">
            <Text className={`font-bold text-[15px] flex-shrink ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`} numberOfLines={1}>
              {product.seller?.shop_name ?? product.seller?.user?.username ?? "Seller"}
            </Text>
            {sellerGamification && (
              <TierBadge
                tier={sellerGamification.tier.key}
                stars={sellerGamification.tier.stars}
                colorHex={sellerGamification.tier.color_hex}
                size="sm"
              />
            )}
          </Pressable>
          <Text className={`text-[13px] ${isDark ? "text-[#aeb0b7]" : "text-text-secondary"}`}>
            {` · ${compactAge(product.created_at)}${isFollowing ? " · following" : ""}`}
          </Text>
          {onOpenActions ? (
            <Pressable
              onPress={handleOpenActions}
              hitSlop={10}
              className="ml-auto w-8 h-8 -mr-1 -my-1 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={`More options for ${product.name}`}
            >
              <MoreHorizontal size={20} color={isDark ? "#c6c5cf" : "#876d64"} />
            </Pressable>
          ) : null}
        </View>

        <Link href={`/productDetails/${product.id}`} asChild>
          <Pressable>
            <View className="flex-row items-start gap-2 mb-1.5">
              <Tag size={17} color="#e26136" strokeWidth={2.2} />
              <Text className={`flex-1 text-[16px] leading-5 font-semibold ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`} numberOfLines={2}>
                {product.name}
              </Text>
            </View>
            <View
              className={`w-full aspect-square overflow-hidden border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-bg-muted border-border"}`}
              style={{ borderRadius: 12 }}
            >
              {imageUrl ? (
                <SkeletonImage
                  source={{ uri: imageUrl }}
                  containerClassName="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={product.images?.[0]?.alt_text ?? product.name}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-text-secondary"}`}>No image</Text>
                </View>
              )}
              <View className="absolute left-3 bottom-3 rounded-full bg-primary px-3 py-1.5">
                <Text className="text-sm font-bold text-white">₦{product.price.toLocaleString()}</Text>
              </View>
            </View>
          </Pressable>
        </Link>

        <View className="flex-row items-center mt-2 gap-1.5">
          {(product.rating > 0 || product.reviews_count > 0) && (
            <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-text-secondary"}`}>
              ★ {product.rating.toFixed(1)}{product.reviews_count > 0 && ` · ${product.reviews_count} reviews`}
            </Text>
          )}
          {topBadges.map((badge) => <BadgeChip key={badge.slug} badge={badge} size="xs" />)}
          {/* No Follow button. It occupied a full row on every card from a
              seller you hadn't followed, competing with Add to cart and Chat --
              the two things the card exists for. Following is an action you
              take on someone's profile, which is a tap away from the name
              above; the header already reads "· following" when you do. */}
        </View>

        {isBuyer && (
          <View className={`flex-row gap-2 mt-2 pt-2 border-t ${isDark ? "border-[#46464e]" : "border-border-light"}`}>
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={adding}
              className={`flex-1 flex-row items-center justify-center gap-2 h-10 rounded-full ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={18} color="#876d64" />
              <Text className={`font-semibold text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>
                {adding ? "Adding…" : "Add to cart"}
              </Text>
            </TouchableOpacity>
            {!isOwnProduct && (
              <TouchableOpacity
                onPress={handleMessageSeller}
                className={`flex-1 flex-row items-center justify-center gap-2 h-10 rounded-full ${isDark ? "bg-[#2f3132]" : "bg-bg-muted"}`}
                accessibilityRole="button"
                accessibilityLabel={`Message seller about ${product.name}`}
              >
                <MessageCircle size={18} color="#876d64" />
                <Text className={`font-semibold text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// See FeedPostCard — same reasoning. Seller identity and follow state are
// compared explicitly because the seller object is rebuilt on every fetch.
export default React.memo(FeedProductCard, (prev, next) => {
  const a = prev.product;
  const b = next.product;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.price === b.price &&
    a.rating === b.rating &&
    a.reviews_count === b.reviews_count &&
    a.images === b.images &&
    a.seller?.user?.id === b.seller?.user?.id &&
    a.seller?.is_followed === b.seller?.is_followed &&
    a.seller?.follower_count === b.seller?.follower_count &&
    prev.onMessageSeller === next.onMessageSeller &&
    prev.onOpenActions === next.onOpenActions
  );
});
