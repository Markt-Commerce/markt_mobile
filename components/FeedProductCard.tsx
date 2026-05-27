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
    <View className="px-4 pt-4">
      <View className="rounded-card overflow-hidden border border-border bg-white">
        <Link href={`/productDetails/${product.id}`} asChild>
          <Pressable>
            {/* Image */}
            <View className="w-full aspect-square bg-bg-muted">
              {imageUrl ? (
                <SkeletonImage
                  source={{ uri: imageUrl }}
                  containerClassName="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={product.images?.[0]?.alt_text ?? product.name}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-text-secondary text-sm">No image</Text>
                </View>
              )}
              <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
                <Text className="text-xs font-semibold text-text-primary">
                  ₦{product.price.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Info */}
            <View className="px-4 pt-3 pb-3">
              <Text
                className="text-sm font-semibold text-text-primary"
                numberOfLines={2}
              >
                {product.name}
              </Text>

              {(product.rating > 0 || product.reviews_count > 0) && (
                <Text className="text-xs text-text-secondary mt-1">
                  ★ {product.rating.toFixed(1)}
                  {product.reviews_count > 0 && ` · ${product.reviews_count} reviews`}
                </Text>
              )}

              <View className="flex-row items-center justify-between mt-2 gap-2">
                <Text className="text-xs text-text-secondary flex-1" numberOfLines={1}>
                  By {product.seller?.shop_name ?? "Seller"}
                  {followerCount > 0 && ` · ${followerCount} follower${followerCount !== 1 ? "s" : ""}`}
                </Text>
                {followeeId && !isOwnProduct && (
                  <TouchableOpacity
                    onPress={(e) => handleFollowToggle(e)}
                    disabled={followLoading}
                    activeOpacity={0.7}
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[32px] justify-center ${isFollowing ? "bg-bg-muted" : "bg-primary"}`}
                    accessibilityRole="button"
                    accessibilityLabel={isFollowing ? "Unfollow seller" : "Follow seller"}
                  >
                    <UserPlus size={14} color={isFollowing ? "#876d64" : "#fff"} />
                    <Text className={`text-xs font-semibold ${isFollowing ? "text-text-primary" : "text-white"}`}>
                      {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-3 h-10 rounded-full bg-primary items-center justify-center">
                <Text className="text-white font-semibold text-sm">View</Text>
              </View>
            </View>
          </Pressable>
        </Link>

        {/* Actions: Add to cart, Message seller (buyers only; hide Message when own product) */}
        {isBuyer && (
          <View className="flex-row gap-2 px-4 pb-4 border-t border-border-light pt-3">
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={adding}
              className="flex-1 flex-row items-center justify-center gap-2 h-10 rounded-full bg-bg-muted"
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={18} color="#876d64" />
              <Text className="text-text-primary font-semibold text-sm">
                {adding ? "Adding…" : "Add to cart"}
              </Text>
            </TouchableOpacity>
            {!isOwnProduct && (
            <TouchableOpacity
              onPress={handleMessageSeller}
              className="flex-1 flex-row items-center justify-center gap-2 h-10 rounded-full bg-bg-muted"
              accessibilityRole="button"
              accessibilityLabel={`Message seller about ${product.name}`}
            >
              <MessageCircle size={18} color="#876d64" />
              <Text className="text-text-primary font-semibold text-sm">Chat</Text>
            </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
