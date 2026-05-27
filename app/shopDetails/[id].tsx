import React, { useEffect, useState} from "react";
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
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#efe9e7]">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#171311" />
          </TouchableOpacity>
          <Text className="text-[#171311] text-lg font-bold flex-1 text-center pr-8">Shop</Text>
          <TouchableOpacity className="p-2">
            <Share size={24} color="#171311" />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <ImageBackground
          source={{
            uri: shop?.user.profile_picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          className="w-full h-56 overflow-hidden bg-[#f4f1f0]"
          resizeMode="cover"
        />

        {/* Profile Section */}
        <View className="px-4 py-4">
          {/* Profile Picture Overlap */}
          <View className="flex-row items-end gap-3 mb-4">
            <Image
              source={{
                uri: shop?.user.profile_picture || defaultProfilePicture,
              }}
              className="w-24 h-24 rounded-full border-4 border-white bg-[#f4f1f0]"
            />
            <View className="flex-1 pb-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-[#171311] text-xl font-bold">{shop?.shop_name}</Text>
              </View>
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-[#e26136] text-sm font-semibold">{shop?.average_rating || 0}</Text>
                <Text className="text-[#876d64] text-xs bg-[#f4f1f0] px-2 py-1 rounded">
                  {shop?.verification_status || "Unverified"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            {shop?.user && (shop as any).can_follow !== false && (
            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 items-center justify-center ${
                isFollowing ? "bg-bg-muted" : "bg-primary"
              }`}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              <Text className={`font-semibold text-sm ${isFollowing ? "text-text-primary" : "text-white"}`}>
                {followLoading ? "Loading…" : isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between gap-4 py-3 border-t border-b border-[#efe9e7]">
            <View className="flex-1 items-center">
              <Text className="text-[#171311] text-lg font-bold">{shop?.stats.product_count || 0}</Text>
              <Text className="text-[#876d64] text-xs mt-1">Products</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[#171311] text-lg font-bold">{shop?.stats.post_count || 0}</Text>
              <Text className="text-[#876d64] text-xs mt-1">Posts</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[#171311] text-lg font-bold">{shop?.stats.follower_count || 0}</Text>
              <Text className="text-[#876d64] text-xs mt-1">Followers</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {shop?.description && (
          <View className="px-4 py-4 border-b border-[#efe9e7]">
            <Text className="text-[#171311] text-base leading-relaxed">{shop?.description}</Text>
          </View>
        )}

      {/* Tabs */}
      <View className="flex-row border-b border-[#e5dedc] px-4 gap-8">
        <View className="flex-1 items-center border-b-[3px] border-[#171311] pb-3 pt-4">
          <Text className="text-[#171311] text-sm font-bold">Products</Text>
        </View>
        <View className="flex-1 items-center border-b-[3px] border-transparent pb-3 pt-4">
          <Text className="text-[#876d64] text-sm font-bold">Posts</Text>
        </View>
      </View>

      {/* Featured */}
      <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">Featured</Text>

      {groupProducts(shop?.recent_products!).map((item, idx) => (
          <ProductDisplayComponent
            key={idx}
            products={item.map(p => ({ ...p, description: p.description ?? "" })) as Product[]}
          />
        ))}

      {/* All Products */}
      <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">All Products</Text>

      <View className="flex-row flex-wrap justify-between px-4">
        {shopProducts.map((item, i) => (
          <ProductDisplayComponent
            key={i}
            products={item.map(p => ({ ...p, description: p.description ?? "" })) as Product[]}
          />
        ))}
      </View>

      {/* All Posts */}
      <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">All Posts</Text>

      {/* <View className="flex-row flex-wrap justify-between px-4">
        {shop?.recent_posts.map((item, i) => (
          <PostDisplayComponent key={i} post={{ }} />
      </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}
