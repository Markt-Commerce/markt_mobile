/**
 * FeedProductCard — Renders a product in the hybrid feed.
 *
 * - View → product detail
 * - Add to cart (buyers)
 * - Message seller (buyers)
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, MessageCircle, UserPlus } from "lucide-react-native";
import type { FeedProduct } from "../types/feed";
import { addToCart } from "../services/sections/cart";
import { followSeller, unfollowSeller } from "../services/sections/users";
import SkeletonImage from "./SkeletonImage";
import { useUser } from "../hooks/userContextProvider";
import { useToast } from "./ToastProvider";
import { useTheme } from "./themeProvider";

interface Props {
  product: FeedProduct;
  onMessageSeller?: (product: FeedProduct) => void;
}

export default function FeedProductCard({ product, onMessageSeller }: Props) {
  const { role, user } = useUser();
  const isOwnProduct = user?.user_id && product.seller?.user?.id && product.seller.user.id === user.user_id;
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [isFollowing, setIsFollowing] = useState(product.seller?.is_followed ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const followeeId = product.seller?.user?.id;
  const followerCount = product.seller?.follower_count ?? 0;

  const imageUrl = product.images?.[0]?.url;
  const isBuyer = role === "buyer";

  const handleAddToCart = async () => {
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
  };

  const handleMessageSeller = () => {
    onMessageSeller?.(product);
  };

  const handleFollowToggle = async (e: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    if (!followeeId || followLoading) return;
    setFollowLoading(true);
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    try {
      if (isFollowing) {
        await unfollowSeller(followeeId);
        show({ variant: "success", title: "Unfollowed", message: "You unfollowed this seller." });
      } else {
        await followSeller(followeeId);
        show({ variant: "success", title: "Following", message: "You are now following this seller." });
      }
    } catch {
      setIsFollowing(prev);
      show({ variant: "error", title: "Error", message: isFollowing ? "Could not unfollow." : "Could not follow." });
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View className="mb-8 px-6">
      <View className={`rounded overflow-hidden border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <Link href={`/productDetails/${product.id}`} asChild>
          <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
            {/* Image occupying ~70% of the card layout as per DESIGN.md mandata */}
            <View className={`w-full aspect-[4/5] relative ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
              {imageUrl ? (
                <SkeletonImage
                  source={{ uri: imageUrl }}
                  containerClassName="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={product.images?.[0]?.alt_text ?? product.name}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className={`font-geist font-bold text-xs tracking-widest uppercase ${isDark ? "text-[#46464e]" : "text-surface-dim"}`}>Image Pending</Text>
                </View>
              )}
              
              {/* Floating Price Badge */}
              <View className="absolute left-6 bottom-6 rounded h-10 px-4 bg-primary items-center justify-center border border-primary/20">
                <Text className="text-sm font-geist font-bold text-white tracking-widest">
                  ₦{product.price.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Info */}
            <View className="p-6">
              <View className="flex-row justify-between items-start gap-4 mb-2">
                <Text
                  className={`flex-1 text-lg font-geist font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                  numberOfLines={2}
                >
                  {product.name}
                </Text>
                {followeeId && !isOwnProduct && (
                  <TouchableOpacity
                    onPress={(e) => handleFollowToggle(e)}
                    disabled={followLoading}
                    activeOpacity={0.8}
                    className={`h-8 px-4 rounded items-center justify-center border ${isFollowing ? (isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border") : "bg-primary border-primary"}`}
                    accessibilityRole="button"
                    accessibilityLabel={isFollowing ? "Unfollow" : "Follow"}
                  >
                    <Text className={`text-[10px] font-geist font-bold tracking-widest uppercase ${isFollowing ? (isDark ? "text-[#c6c5cf]" : "text-tertiary") : "text-white"}`}>
                      {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row items-center gap-2 mb-6">
                <Text className={`font-geist font-bold text-[10px] tracking-widest uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`} numberOfLines={1}>
                  {product.seller?.shop_name ?? "Independent Seller"}
                </Text>
                <View className={`h-1 w-1 rounded ${isDark ? "bg-[#46464e]" : "bg-surface-dim"}`} />
                <Text className={`font-inter text-[11px] ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {followerCount.toLocaleString()} Shapers
                </Text>
              </View>

              {/* Action Bar: RESERVING PRIMARY FOR CONVERSION ONLY */}
              <View className={`flex-row gap-4 pt-2 border-t mt-2 ${isDark ? "border-[#46464e]" : "border-border"}`}>
                <TouchableOpacity
                  onPress={handleAddToCart}
                  disabled={adding}
                  activeOpacity={0.8}
                  className="flex-1 h-14 rounded bg-primary flex-row items-center justify-center gap-3 shadow-sm"
                  accessibilityRole="button"
                >
                  <ShoppingCart size={20} color="#ffffff" strokeWidth={2} />
                  <Text className="text-white font-geist font-bold text-xs tracking-widest uppercase">
                    {adding ? "Adding" : "Add to collection"}
                  </Text>
                </TouchableOpacity>

                {!isOwnProduct && isBuyer && (
                  <TouchableOpacity
                    onPress={handleMessageSeller}
                    activeOpacity={0.8}
                    className={`w-14 h-14 rounded border border-primary items-center justify-center ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
                    accessibilityRole="button"
                  >
                    <MessageCircle size={22} color="#E94C2A" strokeWidth={1.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
