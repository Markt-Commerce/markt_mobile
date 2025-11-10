// app/ShopBySarah.tsx
import React, { useEffect, useState} from "react";
import { useRouter } from "expo-router";
import { View, Text, ImageBackground, ScrollView, Image, TouchableOpacity } from "react-native";
import { ArrowLeft, Share } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { getSellerProducts } from "../../services/sections/product";
import { getUserPublicProfile, getUserShopInfo } from "../../services/sections/users";
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
  const { show } = useToast();

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const profileData = await getUserShopInfo(id);
        setShop(profileData);
        const sellerProducts = await getSellerProducts(profileData.id);
        setShopProducts((prev) => [...prev, ...groupProducts(sellerProducts)]);
      } catch (error) {
        show({
          title: "Error getting shop data",
          message: "There was an error fetching the shop information. Please try again later.",
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

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>

      {/* Cover Image */}
      <View className="px-4 py-3">
        <ImageBackground
          source={{
            uri: shop?.user.profile_picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          className="w-full min-h-80 overflow-hidden bg-white"
          resizeMode="cover"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 pb-2">
            <TouchableOpacity className="p-1">
              <ArrowLeft size={24} color="#171311" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* Profile Section */}
      <View className="flex-row items-start p-4">
        <Image
          source={{
            uri: shop?.user.profile_picture || defaultProfilePicture,
          }}
          className="w-32 h-32 rounded-full"
        />
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-[#171311] text-[22px] font-bold leading-tight">{shop?.shop_name}</Text>
          <Text className="text-[#876d64] text-base">{shop?.stats.follower_count} followers · {shop?.stats.post_count! + shop?.stats.product_count!} items</Text>
          <Text className="text-[#876d64] text-base">{shop?.average_rating} / 5</Text>
          <Text className="text-[#876d64] text-base">{shop?.verification_status}</Text>
        </View>
      </View>

      {/* Follow Button */}
      <View>
        <TouchableOpacity>Follow</TouchableOpacity>
        <TouchableOpacity className="bg-[#f4f1f0] p-2 rounded" onPress={()=>{router.navigate(`/followers/${id}`)}}><Text>Followers</Text></TouchableOpacity>
      </View>

      {/* Description */}
      <Text className="text-[#171311] text-base px-4 pt-1 pb-3">
        {shop?.description}
      </Text>

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
  );
}
