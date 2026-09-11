import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Share } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { getSellerProducts } from "../../services/sections/product";
import {
  getUserPublicProfile,
  getUserShopInfo,
  followSeller,
  unfollowSeller,
} from "../../services/sections/users";
import { ProductResponse } from "../../models/products";
import { ShopData, Post as ShopPost } from "../../models/user";
import { useToast } from "../../components/ToastProvider";
import ProductDisplayComponent from "../../components/productDisplayComponent";
import { Product } from "../../models/feed";
import { defaultProfilePicture } from "../../models/defaults";
import { useTheme } from "../../components/themeProvider";
import { useTokens } from "../../theme/useTokens";
import VerifiedBadge, { isVerifiedSeller } from "../../components/VerifiedBadge";
import { useGamificationLookup } from "../../hooks/useGamificationLookup";
import { useBadges } from "../../hooks/useBadges";
import TierBadge from "../../components/gamification/TierBadge";
import BadgeGrid from "../../components/gamification/BadgeGrid";
import FeedPostCard from "../../components/FeedPostCard";
import type { FeedPost } from "../../types/feed";
import { saveItem, unsaveItem } from "../../services/sections/saved";
import { tierColor } from "../../theme/tierColors";

function ShopPostCard({ post, shop }: { post: ShopPost; shop: ShopData }) {
  const [saved, setSaved] = useState(false);
  const feedPost: FeedPost = {
    id: post.id,
    type: "post",
    caption: post.caption,
    user: {
      id: shop.user.id,
      username: shop.shop_name || shop.user.username,
      profile_picture: shop.user.profile_picture,
    },
    media: (post.media ?? []).map((item) => ({ url: item.url, type: item.type })),
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    created_at: post.created_at,
    niche: null,
  };

  const toggleSaved = async () => {
    const previous = saved;
    setSaved(!previous);
    try {
      if (previous) await unsaveItem("post", post.id);
      else await saveItem("post", post.id);
    } catch {
      setSaved(previous);
    }
  };

  return <FeedPostCard post={feedPost} saved={saved} onToggleSaved={toggleSaved} />;
}

export default function Shop() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<ShopData>();
  const [shopProducts, setShopProducts] = useState<ProductResponse[][]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "posts">("products");
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = useTokens();
  const { profile: sellerGamification } = useGamificationLookup(shop?.user?.id);
  const { badges: sellerBadges } = useBadges(shop?.user?.id);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const profileData = await getUserShopInfo(id);
        setShop(profileData);
        setIsFollowing((profileData as any).is_followed ?? false);
        const sellerProducts = await getSellerProducts(profileData.id);
        setShopProducts(groupProducts(sellerProducts));
      } catch (error) {
        show({
          title: "Error getting shop data",
          message:
            "There was an error fetching the shop information. Please try again later." +
            error,
          variant: "error",
        });
      }
    };
    fetchShopData();
  }, [id]);

  const groupProducts = (products: ProductResponse[]) => {
    const groupedProducts = [];
    for (let i = 0; i < products?.length; i += 2) {
      groupedProducts.push(products.slice(i, i + 2));
    }
    return groupedProducts;
  };

  const handleFollowToggle = async () => {
    const followeeId = shop?.user?.id;
    if (!followeeId || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowSeller(followeeId);
        setIsFollowing(false);
        show({
          variant: "success",
          title: "Unfollowed",
          message: "You unfollowed this shop.",
        });
      } else {
        await followSeller(followeeId);
        setIsFollowing(true);
        show({
          variant: "success",
          title: "Following",
          message: "You are now following this shop!",
        });
      }
    } catch (error) {
      show({
        variant: "error",
        title: "Error",
        message: isFollowing
          ? "Could not unfollow shop."
          : "Could not follow shop.",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View
          className="flex-row items-center justify-between px-6 py-4 border-b border-border"
        >
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color={t.textPrimary} />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold flex-1 text-center pr-4 text-text-primary"
          >
            Shop
          </Text>
          <TouchableOpacity className="p-1">
            <Share size={24} color={t.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Cover image.
            This used to render the shop's *avatar* blown up to full width, so
            every shop page showed the same picture twice — once stretched
            across the top and once as the circle sitting on it. Sellers now
            have a real banner; when there is none, a tinted block is a better
            answer than the avatar again. */}
        {shop?.banner_url ? (
          <ImageBackground
            source={{ uri: shop.banner_url }}
            className="w-full h-56 overflow-hidden bg-media"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-56 bg-primary-muted" />
        )}

        {/* Profile Section */}
        <View className="px-6 py-6">
          {/* Profile Picture Overlap */}
          <View className="flex-row items-end gap-4 mb-6">
            <Image
              source={{
                uri: shop?.user.profile_picture || defaultProfilePicture,
              }}
              className="w-24 h-24 rounded-full border-4 border-surface-page bg-surface-sunken"
            />
            <View className="flex-1 pb-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-2xl font-bold text-text-primary"
                >
                  {shop?.shop_name}
                </Text>
                {sellerGamification && (
                  <TierBadge
                    tier={sellerGamification.tier.key}
                    stars={sellerGamification.tier.stars}
                    colorHex={tierColor(sellerGamification.tier?.key, t)}
                    size="sm"
                  />
                )}
              </View>
              <View className="flex-row items-center gap-2 mt-2">
                <Text
                  className="text-sm font-bold text-text-primary"
                >
                  {shop?.average_rating || 0}
                </Text>
                {/* Only shown when actually verified. This printed the raw
                    status, so an unverified shop displayed "pending" inside
                    something shaped like a badge. */}
                {isVerifiedSeller(shop?.verification_status) ? (
                  <VerifiedBadge label="Verified seller" />
                ) : null}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            {shop?.user && (shop as any).can_follow !== false && (
              <TouchableOpacity
                className={`flex-1 rounded h-12 items-center justify-center ${
                  isFollowing
                    ? isDark
                      ? "bg-dark-elevated"
                      : "bg-surface-sunken"
                    : "bg-primary-fill"
                }`}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                <Text
                  className={`font-bold text-sm ${isFollowing ? ("text-text-primary") : "text-white"}`}
                >
                  {followLoading
                    ? "Loading..."
                    : isFollowing
                      ? "Following"
                      : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Row */}
          <View
            className="flex-row justify-between gap-4 py-6 border-t border-b border-border"
          >
            <View className="flex-1 items-center">
              <Text
                className="text-xl font-bold text-text-primary"
              >
                {shop?.stats.product_count || 0}
              </Text>
              <Text
                className="text-text-secondary text-xs mt-1"
              >
                Products
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text
                className="text-xl font-bold text-text-primary"
              >
                {shop?.stats.post_count || 0}
              </Text>
              <Text
                className="text-text-secondary text-xs mt-1"
              >
                Posts
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text
                className="text-xl font-bold text-text-primary"
              >
                {shop?.stats.follower_count || 0}
              </Text>
              <Text
                className="text-text-secondary text-xs mt-1"
              >
                Followers
              </Text>
            </View>
          </View>
        </View>

        {/* Badges earned */}
        {sellerBadges.filter((b) => b.earned).length > 0 && (
          <View
            className="px-6 py-6 border-b border-border"
          >
            <Text
              className="text-text-primary text-xl font-bold mb-4"
            >
              Badges earned
            </Text>
            <BadgeGrid
              badges={sellerBadges.filter((b) => b.earned)}
              onBadgePress={(b) => router.push(`/gamification/badge/${b.slug}` as any)}
            />
          </View>
        )}

        {/* Description */}
        {shop?.description && (
          <View
            className="px-6 py-6 border-b border-border"
          >
            <Text
              className="text-text-primary text-base leading-7"
            >
              {shop?.description}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View
          className="flex-row border-b px-6 gap-8 border-border"
        >
          <TouchableOpacity
            className={`flex-1 items-center border-b-[2px] pb-4 pt-6 ${activeTab === "products" ? "border-primary" : "border-transparent"}`}
            onPress={() => setActiveTab("products")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "products" }}
          >
            <Text
              className={`text-sm font-bold ${activeTab === "products" ? ("text-text-primary") : "text-text-secondary"}`}
            >
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center border-b-[2px] pb-4 pt-6 ${activeTab === "posts" ? "border-primary" : "border-transparent"}`}
            onPress={() => setActiveTab("posts")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "posts" }}
          >
            <Text
              className={`text-sm font-bold ${activeTab === "posts" ? ("text-text-primary") : "text-text-secondary"}`}
            >
              Posts
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "products" ? (
          <>
            {/* Featured */}
            <Text
              className="text-text-primary text-xl font-bold px-6 pb-4 pt-8"
            >
              Featured
            </Text>

            {groupProducts(shop?.recent_products ?? []).map((item, idx) => (
              <ProductDisplayComponent
                key={idx}
                products={
                  item.map((p) => ({
                    ...p,
                    description: p.description ?? "",
                  })) as Product[]
                }
              />
            ))}

            {/* All Products */}
            <Text
              className="text-text-primary text-xl font-bold px-6 pb-4 pt-8"
            >
              All Products
            </Text>

            <View className="px-2">
              {shopProducts.map((item, i) => (
                <ProductDisplayComponent
                  key={i}
                  products={
                    item.map((p) => ({
                      ...p,
                      description: p.description ?? "",
                    })) as Product[]
                  }
                />
              ))}
            </View>
          </>
        ) : (
          <View className="pt-2">
            {(shop?.recent_posts ?? []).length === 0 ? (
              <View className="items-center justify-center py-16 px-6">
                <Text className="text-text-secondary text-sm text-center">
                  This shop hasn't posted anything yet.
                </Text>
              </View>
            ) : (
              (shop?.recent_posts ?? []).map((post) => (
                <ShopPostCard key={post.id} post={post} shop={shop!} />
              ))
            )}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
