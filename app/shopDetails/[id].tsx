import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, ImageBackground, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Share, Heart, MessageCircle } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { getSellerProducts } from "../../services/sections/product";
import { getUserPublicProfile, getUserShopInfo, followSeller, unfollowSeller } from "../../services/sections/users";
import { ProductResponse } from "../../models/products";
import { ShopData } from "../../models/user";
import { useToast } from "../../components/ToastProvider";
import ProductDisplayComponent from "../../components/productDisplayComponent";
import { Product } from "../../models/feed";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import { defaultProfilePicture } from "../../models/defaults";

export default function Shop() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<ShopData>();
  const [shopProducts, setShopProducts] = useState<ProductResponse[][]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const profileData = await getUserShopInfo(id);
        setShop(profileData);
        setIsFollowing((profileData as any).is_followed ?? false);
        const sellerProducts = await getSellerProducts(profileData.id);
        setShopProducts((prev) => [...prev, ...groupProducts(sellerProducts)]);
      } catch (error) {
        show({
          title: "Error getting shop data",
          message: "There was an error fetching the shop information. Please try again later." + error,
          variant: "error"
        })
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
  }

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
        message: isFollowing ? "Could not unfollow shop." : "Could not follow shop.",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header with back button */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="text-black text-xl font-geist font-bold flex-1 text-center pr-4">Shop</Text>
          <TouchableOpacity className="p-1">
            <Share size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <ImageBackground
          source={{
            uri: shop?.user.profile_picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          className="w-full h-56 overflow-hidden bg-surface"
          resizeMode="cover"
        />

        {/* Profile Section */}
        <View className="px-6 py-6">
          {/* Profile Picture Overlap */}
          <View className="flex-row items-end gap-4 mb-6">
            <Image
              source={{
                uri: shop?.user.profile_picture || defaultProfilePicture,
              }}
              className="w-24 h-24 rounded border-4 border-white bg-surface"
            />
            <View className="flex-1 pb-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-black text-2xl font-geist font-bold">{shop?.shop_name}</Text>
              </View>
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-black text-sm font-geist font-bold">{shop?.average_rating || 0}</Text>
                <View className="px-2 py-0.5 rounded bg-surface">
                  <Text className="text-tertiary text-[10px] font-geist font-bold uppercase tracking-wider">
                    {shop?.verification_status || "Unverified"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            {shop?.user && (shop as any).can_follow !== false && (
              <TouchableOpacity
                className={`flex-1 rounded h-12 items-center justify-center ${isFollowing ? "bg-surface" : "bg-primary"
                  }`}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                <Text className={`font-geist font-bold text-sm ${isFollowing ? "text-black" : "text-white"}`}>
                  {followLoading ? "Loading…" : isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between gap-4 py-6 border-t border-b border-border">
            <View className="flex-1 items-center">
              <Text className="text-black text-xl font-geist font-bold">{shop?.stats.product_count || 0}</Text>
              <Text className="text-tertiary font-inter text-xs mt-1">Products</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-black text-xl font-geist font-bold">{shop?.stats.post_count || 0}</Text>
              <Text className="text-tertiary font-inter text-xs mt-1">Posts</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-black text-xl font-geist font-bold">{shop?.stats.follower_count || 0}</Text>
              <Text className="text-tertiary font-inter text-xs mt-1">Followers</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {shop?.description && (
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-black font-inter text-base leading-7">{shop?.description}</Text>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row border-b border-border px-6 gap-8">
          <View className="flex-1 items-center border-b-[2px] border-primary pb-4 pt-6">
            <Text className="text-black text-sm font-geist font-bold">Products</Text>
          </View>
          <View className="flex-1 items-center border-b-[2px] border-transparent pb-4 pt-6">
            <Text className="text-tertiary text-sm font-geist font-bold">Posts</Text>
          </View>
        </View>

        {/* Featured */}
        <Text className="text-black text-xl font-geist font-bold px-6 pb-4 pt-8">Featured</Text>

        {groupProducts(shop?.recent_products!).map((item, idx) => (
          <ProductDisplayComponent
            key={idx}
            products={item.map(p => ({ ...p, description: p.description ?? "" })) as Product[]}
          />
        ))}

        {/* All Products */}
        <Text className="text-black text-xl font-geist font-bold px-6 pb-4 pt-8">All Products</Text>

        <View className="px-2">
          {shopProducts.map((item, i) => (
            <ProductDisplayComponent
              key={i}
              products={item.map(p => ({ ...p, description: p.description ?? "" })) as Product[]}
            />
          ))}
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
