// app/product/[id].tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground, Pressable, FlatList } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { getProductById } from "../../services/sections/product";
import { ProductDetail } from "../../models/products";
import { ArrowLeft, ShoppingBag, ArrowBigDown, MessageCircle, ShoppingCart } from "lucide-react-native";
import { addToCart } from "../../services/sections/cart";
import { getRecommendedProducts } from "../../services/sections/feed";
import { Product } from "../../models/feed";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import { useUser } from "../../hooks/userContextProvider";


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
  const {user, role} = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const ChatBottomSheetRef = useRef<BottomSheet>(null);

  const toggleDetail = (key: string) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);


  const getOtherProducts = async () => {
    try {
      const products = await getRecommendedProducts(page);
      setSimilarProducts((prev)=>[...prev,...products])
    }
    catch (err) {
      //todo: work on displaying errors to users
      console.error("Failed to fetch product:", err);
    }
  }

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

const addProductToCart = async (product:ProductDetail)=>{
  try {
      const res = await addToCart({product_id: product.id,variant_id:0,quantity});
      console.log("done adding to cart")
    } catch (error) {
      console.error("couldn't add to cart: ", error)
    }
  }

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  if (!product) return <ActivityIndicator size="large" />;

  return (
  <SafeAreaView className="flex-1 bg-white">
    <FlatList
      data={similarProducts}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <>

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
        </ImageBackground>

        {/* Buttons: Only active if user is a buyer*/}
        {
          role == "buyer" &&
          (
            <View className="flex-row justify-center gap-3 p-4">
              <TouchableOpacity className="flex-1 bg-gray-200 rounded-lg h-10 justify-center items-center" onPress={() => addProductToCart(product)}>
                <Text className="text-[#171311] font-bold">Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#e26136] rounded-lg h-10 justify-center items-center" onPress={()=> ChatBottomSheetRef.current?.expand()}>
                <Text className="text-white font-bold">Message Seller</Text>
              </TouchableOpacity>
            </View>
          )
        }


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

        <View className="h-5 bg-white" />
      </ScrollView>

          {/* Title before similar products */}
          <Text className="px-4 pt-5 pb-3 text-[22px] font-bold text-[#171311]">
            Other Similar Products
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <View className="px-4 pt-3 w-[48%]">
          <Link href={`/productDetails/${item.id}`} asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <View className="rounded-2xl overflow-hidden border border-[#efe9e7] bg-white">
                <ImageBackground
                  source={{ uri: item.images?.[0]?.media?.original_url }}
                  className="w-full aspect-square"
                  resizeMode="cover"
                >
                  <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
                    <Text className="text-[12px] font-semibold text-[#111418]">
                      {item.price}
                    </Text>
                  </View>
                </ImageBackground>

                <View className="px-3 pt-2 pb-3">
                  <Text className="text-[14px] font-semibold text-[#171311]" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="flex-row justify-between mt-2">
                    <TouchableOpacity className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#f5f2f1]">
                      <ShoppingCart size={16} color="#60758a" />
                      <Text className="text-[12px] text-[#111418]">Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#f5f2f1]">
                      <MessageCircle size={16} color="#60758a" />
                      <Text className="text-[12px] text-[#111418]">Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </View>
      )}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 4 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      onEndReached={getOtherProducts}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View className="py-5">
            <ActivityIndicator size="large" color="#e26136" />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View className="items-center justify-center py-16">
            <Text className="text-[#171311] font-semibold text-base">No items yet</Text>
            <Text className="text-[#876d64] text-sm mt-1">
              Pull up to load more or create something new.
            </Text>
          </View>
        ) : null
      }
    />

    <QuickChatBottomSheet sheetRef={ChatBottomSheetRef} sellerId={product.seller_id.toString()} buyerId={user?.user_id?.toString() || ""}/>
  </SafeAreaView>
);

}


