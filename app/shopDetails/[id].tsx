// app/ShopBySarah.tsx
import React, { useEffect, useState} from "react";
import { View, Text, ImageBackground, ScrollView, Image, TouchableOpacity } from "react-native";
import { ArrowLeft, Share } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { getSellerProducts } from "../../services/sections/product";
import { getUserPublicProfile, getUserShopInfo } from "../../services/sections/users";

export default function Shop() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const profileData = await getUserShopInfo(id);
        console.log("Fetched shop profile:", profileData);
        //const sellerProducts = await getSellerProducts(id);
        //setShop({ ...profileData, products: sellerProducts });
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } 
    };
    fetchShopData();
  }, [id]);

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>

      {/* Cover Image */}
      <View className="px-4 py-3">
        <ImageBackground
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGc16JP6_OIzByauKbHb4NGeg7GP58-NEEsQEh8LaG2-foAXr0ZCtC6NiAVj0YigcNhPrlcni3LqIclo425kQ5WUVAJYzbb-hhh1rWREMqyuwhIVvanP48t9IuEoxzQpYeJyKlOTS2nCXgYtJzFf0nt9nIIt-G3nA-9LHLzVFwLB66KBwlvjwpfFw9h1govTzaZgH98IgXzgWgAeG8igknAwqK4zf88O5sdJqpC-NxvpZMmGklvC4vs80ZvaIFf-8yBuP5s0o26g",
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
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzDeoJKxOR8a_fCD3CmuAaDlH_OlCxRjt2lUWuFG--Irgo3bwc9OJiW8DPoHhIGq5cCN_ulsUFKcdyNJGHHYv54eDwg-1Bmqq5G7UuZu_rMZMVPvqvJwRo4vr_PtkJpUkdvk5eIBJReYpuOEA9PieYJEihnjQWxtghJfEsz4tey0NrCly_qR-K-iVBXC4dTgZWLIz_ki3JupYPp3EnONwURdrWPLqscBzBMgrvCzFXxf7LDq82jConJYruRxnDZwbp4IjoCf8wzg",
          }}
          className="w-32 h-32 rounded-full"
        />
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-[#171311] text-[22px] font-bold leading-tight">Shop by Sarah</Text>
          <Text className="text-[#876d64] text-base">100K followers · 100 items</Text>
          <Text className="text-[#876d64] text-base">Sarah's shop</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-[#171311] text-base px-4 pt-1 pb-3">
        Sarah's shop offers a curated collection of vintage and handmade clothing, perfect for the modern bohemian.
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 gap-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {[
          {
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuA3354xyeGlTNKMbGF9b-rXlcLgvpWGdC7v-x4ke6Foj0AukPkm6alpVZPjLq7OrmkfSL3eysKL6sYRZs6myTh4DUBnFnVnET2MMPFe_XtcP1y35qs6nEfdbR9sIFJJLHlkIryDgYiPDt8SrSbmjMK9xmvsAr1em9CwrV2nC1iTrFJRqXD0WT9ieIaAN3WbcAGOe_Q2jqLxlCe3P8_x9K96aKIe7eSNKUxgnf7WGIU3_IKarV0LMbiQpTLM1gKXRF0U9P9jltok3w",
            name: "Vintage Denim Jacket",
            price: "$80",
          },
          {
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Hooyors-sY7BTe0uZgKfTbLTFMQuKazarIuPebfy7KirceP_BxBoEg4wS_GgLZPYwTD8R43vhRi1auXz0NsnEVib3akiRvvSQwK88me2soyVUK-nTLpeMjOxJO5YnrkWocsASECeHPU9RMU8-aOHNYPs5D_f5DymnkB2Q30X69fCiV5HVR4k4FqvgxacuUsQMruFY5soW3JnajGkQr1uRZ1BHh5eqrgIP0yG-37zKyterhfwfwt_jfeadnJrqvW_ewnuO-8QWw",
            name: "Handmade Knit Sweater",
            price: "$65",
          },
          {
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuAHKtAOxaDvPc4Cat93AlxV3cfmPggfj_oBlCSXwFiet3PB47nNi0_lFDjXQV2m2G_GXip7k3DvXmwWIgZG6SBC2JPTqQHICtTW4KcVb9Vvax_RtjZBT_WiFz2y_jCBJHdB5Y_Hb3MrVO348-7OW3h6znbZ0bpoaY7kJ_zfUUFTpfUduaVboPelX1qIHdYDc_NuJPJSy5Gs_QoYu78WYqpPaeesE7e-8XZ9vqy3BuSwoWj455rs_w1Oj4F5nJs9EgsQWJBSvGJkbQ",
            name: "Boho Maxi Dress",
            price: "$55",
          },
        ].map((item, idx) => (
          <View key={idx} className="min-w-40 flex flex-col gap-2">
            <ImageBackground
              source={{ uri: item.image }}
              className="aspect-square rounded-lg overflow-hidden"
              resizeMode="cover"
            />
            <Text className="text-[#171311] text-base font-medium">{item.name}</Text>
            <Text className="text-[#876d64] text-sm">{item.price}</Text>
          </View>
        ))}
      </ScrollView>

      {/* All Products */}
      <Text className="text-[#171311] text-lg font-bold px-4 pb-2 pt-4">All Products</Text>

      <View className="flex-row flex-wrap justify-between px-4">
        {[
          "Vintage Denim Jacket",
          "Handmade Knit Sweater",
          "Boho Maxi Dress",
          "Leather Ankle Boots",
          "Silk Scarf",
          "Embroidered Tote Bag",
        ].map((name, i) => (
          <View key={i} className="w-[48%] mb-4">
            <View className="aspect-square rounded-lg bg-[#eee]" />
            <Text className="text-[#171311] text-base font-medium mt-2">{name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
