// app/product/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground, Pressable } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { getProductById } from "../../services/sections/product";
import { ProductDetail } from "../../models/products";
import { ArrowLeft, ShoppingBag, ArrowBigDown } from "lucide-react-native";
import { addToCart } from "../../services/sections/cart";


export default function ProductDetails() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openDetails, setOpenDetails] = useState<{ [key: string]: boolean }>({
    details: true,
    sizeFit: false,
    composition: false,
    delivery: false,
  });
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail>();

  const toggleDetail = (key: string) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const similarProducts = [
    {
      title: "Boho Chic",
      subtitle: "Maxi Dress",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsAuq9ncI-XkaOCPWP3lPRMQtq_76S9byu9EXBqijShU9ehM7zNBN3q6A19F8WAYEGAHaKz5P0lnyvDxyM3B-30OiqJsey3aLWPMFWvc39wfNsXF3ykcsB2Fph4eI88D0JSFTjE7ySN_rueIUm7-Z0AyXtyL4rAkQHNR1eJlpOWGjzDFL_zP0nXP7DGNyxGGo_76rpDh7Y8-3qc3jfqILtZc1C6C-sIbqdOJaBQpXMhJ4Mc-aLBPWkAbGRyYE1_GxQ5X6DlBb6mg",
    },
    {
      title: "Summer Breeze",
      subtitle: "Sundress",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCS-XPMKocQzv_cIUAz0VRPziH5_ARbkRfyVN17OlaTFhsbJh6PwObs3vL5J7pRX6D_Up7HTT8eZltOZF8GpPag0K81APX0TENwtQCdrjuIOa-mudGh6YTJNJd9t_0_oWsNjSeiA9Cj7A6v46s7HCMOkurHIIXUc2sU3Md6K1aJT9DjtXsId7kpvUyXbKkNKfnpYvXhnJs_sO_ZiphbySHsoNB8kspiEtO3DX4Fz8GEyy6Q8UC-oMEZJzVRqgPVNUbDnwNy8pY7yA",
    },
    {
      title: "Casual Comfort",
      subtitle: "T-Shirt Dress",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASeebAhEuIK6CPfE0XQ2APvfGKT-trIHaZHvHKYpgPrHGGXnluFFuK-exlmYNTh4EomtwaojzYBrpwh_NyZwj1G_0Pv6MoJHxrklMREH8vVFoKeBHmmOhD3gnHyZIrWLCE_cGMDR61Ob3Jp2O-ZqGQe6-Qeu_3rsmGUodGGqStyFXNOhvFxOCgrdeDg__e6-xlrkDDtZcZ3ibvO_6vrPLxMLt3QWCl-nct_N1k4GERlPdlyHWqEmWtGRlP5HIx7pGR_21gWBf53Q",
    },
  ];

  const fetchProduct = async (id: string) => {
  try {
    const product = await getProductById(id);
    setProduct(product);
  }
  catch (err) {
    //todo: work on displaying errors to users
    console.error("Failed to fetch product:", err);
  }
}

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  if (!product) return <ActivityIndicator size="large" />;

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pb-2">
        <ArrowLeft color="#171311" size={24} />
        <TouchableOpacity className="p-2" onPress={()=> router.navigate("/cart")}>
          <ShoppingBag color="#171311" size={24} />
        </TouchableOpacity>
      </View>

      {/* Image Carousel */}
      <ImageBackground
        source={{
          uri: product.images[0].media.original_url,
        }}
        className="h-80 justify-end p-5"
        imageStyle={{ borderRadius: 12 }}
      >
        <View className="flex-row justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              className={`w-3 h-3 rounded-full bg-white ${i === 0 ? "" : "opacity-50"}`}
            />
          ))}
        </View>
      </ImageBackground>

      {/* Buttons */}
      <View className="flex-row justify-center gap-3 p-4">
        <TouchableOpacity className="flex-1 bg-gray-200 rounded-lg h-10 justify-center items-center" onPress={
          ()  => {
            addToCart({product_id: product.id,variant_id:0,quantity,...product});
          }
        }>
          <Text className="text-[#171311] font-bold">Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-[#e26136] rounded-lg h-10 justify-center items-center">
          <Text className="text-white font-bold">Message Seller</Text>
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <Text className="px-4 pt-4 text-lg font-bold text-[#171311]">{product.name}</Text>
      <Text className="px-4 pt-1 pb-3 text-base text-[#171311]">sold by {product.seller.shop_name}</Text>
      {/* Note to work on a way to determine or get the currency type */}
      <Text className="px-4 pt-1 pb-3 text-base text-[#171311]">${product.price}</Text>

      {/* Quantity Selection */}
      <View className="px-4 py-2">
        <Text className="text-[#171311] font-medium text-sm mb-2">Quantity</Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            className="bg-gray-200 h-8 w-8 rounded-lg justify-center items-center"
          >
            <Text className="text-[#171311] text-lg">-</Text>
          </TouchableOpacity>
          <Text className="text-[#171311] text-lg">{quantity}</Text>
          <TouchableOpacity
            onPress={() => product.stock && setQuantity((q) => Math.min(product.stock, q + 1))}
            className="bg-gray-200 h-8 w-8 rounded-lg justify-center items-center"
          >
            <Text className="text-[#171311] text-lg">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collapsible Details */}
      {["details", "sizeFit", "composition", "delivery"].map((key) => (
        <View key={key} className="border-t border-[#e5dedc] px-4 py-2">
          <Pressable
            onPress={() => toggleDetail(key)}
            className="flex-row justify-between items-center py-2"
          >
            <Text className="text-[#171311] font-medium text-sm">
              {key === "details"
                ? "The Details"
                : key === "sizeFit"
                ? "Size & Fit"
                : key === "composition"
                ? "Composition & Care"
                : "Delivery & Return"}
            </Text>
            <ArrowBigDown
              size={20}
              color="#171311"
              style={{ transform: [{ rotate: openDetails[key] ? "180deg" : "0deg" }] }}
            />
          </Pressable>
          {openDetails[key] && (
            <Text className="text-[#876d64] text-sm pb-2">
              {product.description}
            </Text>
          )}
        </View>
      ))}

      {/* Seller Info */}
      <Text className="px-4 pt-5 text-[22px] font-bold text-[#171311]">Seller Information</Text>
      <View className="flex-row items-center gap-4 px-4 py-2">
        <ImageBackground
          className="h-14 w-14 rounded-full bg-gray-300"
          source={{
            uri:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBPgKLgv9Gj5fb8il50qh4RJ7omsqpUBxvR5tYhU0iMUC2l64p0ORmCP4vp_yFD3jhgbTd-GteEkuyrFjpHpnl_xHUEedkYz4iC0ZZE6xgl_dfP7zm7QoNocJjfMAVs07fHHxYKw6A9q7a-ecglWwcHPFDnsxPBK2JrbAAf07o7GqGYNLW4VozfX8TFlJ205dTq7yvM3OINZcxXZLqz-3Z-iMZ1jqGne20WwBNKXx1ahWVtp3OrNH7nnCy5ulL0MOnBmZpcOci_Gg")',
          }}
        />
        <View>
          <Text className="text-[#171311] font-medium text-base">Shop: {product.seller.shop_name}</Text>
          <Text className="text-[#876d64] text-sm"> Average Rating: {product.seller.average_rating}</Text>
        </View>
      </View>
      <View className="px-4 py-3 flex-row justify-end">
        <Link href={`/shop/${product.seller.id}`} asChild>
        <TouchableOpacity className="bg-gray-200 h-10 rounded-lg px-4 justify-center items-center">
          <Text className="text-[#171311] font-bold">View Shop</Text>
        </TouchableOpacity>
        </Link>
      </View>

      {/* Similar Products */}
      <Text className="px-4 pt-5 pb-3 text-[22px] font-bold text-[#171311]">
        Other Similar Products
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        <View className="flex-row gap-3">
          {similarProducts.map((product, idx) => (
            <View key={idx} className="min-w-[120px] gap-2 flex-1">
              <ImageBackground
                source={{ uri: product.image }}
                className="w-full aspect-[3/4] rounded-lg"
              />
              <Text className="text-[#171311] text-base font-medium">{product.title}</Text>
              <Text className="text-[#876d64] text-sm">{product.subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="h-5 bg-white" />
    </ScrollView>
  );
}