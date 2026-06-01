// app/product/[id].tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground, Pressable, FlatList, Dimensions } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { getProductById, trackProductView } from "../../services/sections/product";
import { ProductDetail } from "../../models/products";
import { ArrowLeft, ShoppingBag, ArrowBigDown, MessageCircle, ShoppingCart } from "lucide-react-native";
import { addToCart } from "../../services/sections/cart";
import { getRecommendedProducts } from "../../services/sections/feed";
import { Product } from "../../models/feed";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import { useUser } from "../../hooks/userContextProvider";
import { useToast } from "../../components/ToastProvider";
import { formatNaira } from "../../utils/formatCurrency";
import { isOwnProductListing } from "../../utils/chatGuards";
import { normalizeUri, resolveMediaUri } from "../../utils/imageUri";
import Avatar from "../../components/Avatar";
import { useTheme } from "../../components/themeProvider";

export default function ProductDetails() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
      show({
        variant: "error",
        title: "Error loading products",
        message: "There was an issue retrieving similar products.",
      })
    }
  }

  const fetchProduct = async (id: string) => {
  try {
    const product = await getProductById(id);
    setProduct(product);
  }
  catch (err) {
    show({
        variant: "error",
        title: "Error loading product",
        message: "There was an issue retrieving the product.",
      })
  }
}

const addProductToCart = async (product:ProductDetail)=>{
  try {
      const res = await addToCart({product_id: product.id,variant_id:0,quantity});
      show({
        variant: "success",
        title: "Product added to cart",
        message: "The product has been successfully added to your cart.",
      });
      setAddedToCart(true);
    } catch (error) {
      show({
        variant: "error",
        title: "Error adding to cart",
        message: "Could not add the product to the cart.",
      })
    }
  }

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => {
      trackProductView(id).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [id]);

  if (!product) return <ActivityIndicator size="large" />;

  const sellerUserId = product.seller_user?.id ?? (product as any).seller?.user?.id;
  const isOwnProduct = isOwnProductListing(user?.user_id, sellerUserId);
  const canMessageSeller = role === "buyer" && !isOwnProduct;

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "left", "right", "bottom"]}>
    <FlatList
      data={similarProducts}
      keyExtractor={(item) => item.id.toString()+Math.random().toString()}
      ListHeaderComponent={
        <>

        <ScrollView className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft color={isDark ? "#f0f1f2" : "#000000"} size={24} />
          </TouchableOpacity>
          {role == "buyer" && <TouchableOpacity className="p-2" onPress={()=> router.navigate("/cart")}>
            <ShoppingBag color={isDark ? "#f0f1f2" : "#000000"} size={24} />
          </TouchableOpacity>}
        </View>

        {/* Image Carousel */}
        {product.images && product.images.length > 0 && (
          <View className={isDark ? "bg-[#2f3132]" : "bg-surface"}>
            <FlatList
              data={product.images}
              keyExtractor={(_, idx) => idx.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              snapToInterval={Dimensions.get("window").width}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get("window").width);
                setCurrentImageIndex(idx);
              }}
              renderItem={({ item }) => {
                const uri = resolveMediaUri(item?.media);
                return (
                  <View style={{ width: Dimensions.get("window").width }}>
                    {uri ? (
                      <ImageBackground
                        source={{ uri }}
                        className="h-80 w-full justify-end p-5"
                        imageStyle={{ borderRadius: 8 }}
                      />
                    ) : (
                      <View className={`h-80 w-full items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                        <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No image</Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />

            {/* Dots indicator */}
            {product.images.length > 1 && (
              <View className="flex-row justify-center gap-2 py-3">
                {product.images.map((_, idx) => (
                  <View
                    key={idx}
                    className={`h-2 rounded transition-all ${
                      idx === currentImageIndex ? "bg-primary w-6" : (isDark ? "bg-[#46464e] w-2" : "bg-border w-2")
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Buttons: Only active if user is a buyer*/}
        {role === "buyer" && (
            <View className="flex-row justify-center gap-4 px-6 py-4">
              <TouchableOpacity
                className={`flex-1 rounded h-12 justify-center items-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
                disabled={addedToCart || isOwnProduct}
                style={{
                  backgroundColor: addedToCart ? "#178b1f" : undefined,
                  opacity: isOwnProduct ? 0.5 : 1,
                }}
                onPress={() => addProductToCart(product)}
              >
                <Text
                  className="font-geist font-bold"
                  style={{ color: addedToCart ? "#ffffff" : (isDark ? "#f0f1f2" : "#000000") }}
                >
                  {!addedToCart ? "Add to Cart" : "Added"}
                </Text>
              </TouchableOpacity>
              {canMessageSeller ? (
                <TouchableOpacity
                  className="flex-1 bg-primary rounded h-12 justify-center items-center"
                  onPress={() => ChatBottomSheetRef.current?.expand()}
                >
                  <Text className="text-white font-geist font-bold">Message Seller</Text>
                </TouchableOpacity>
              ) : isOwnProduct ? (
                <View className={`flex-1 rounded h-12 justify-center items-center px-2 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                  <Text className={`text-xs text-center font-geist font-bold ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Your listing</Text>
                </View>
              ) : null}
            </View>
          )}


        {/* Product Info */}
        <View className="px-6">
          <Text className={`text-2xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{product.name}</Text>
          <Text className={`text-base font-inter mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>sold by {product.seller.shop_name}</Text>
          <Text className={`text-xl font-geist font-bold mt-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{formatNaira(product.price)}</Text>
        </View>

        {/* Quantity Selection */}
        <View className="px-6 py-6">
          <Text className={`font-geist font-bold text-sm mb-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Quantity</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className={`h-10 w-10 rounded justify-center items-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
            >
              <Text className={`text-xl font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>−</Text>
            </TouchableOpacity>
            <Text className={`text-lg font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => product.stock && setQuantity((q) => Math.min(product.stock, q + 1))}
              className={`h-10 w-10 rounded justify-center items-center border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
            >
              <Text className={`text-xl font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Details */}
        <View className="mt-2">
          {["details", "sizeFit", "composition", "delivery"].map((key) => (
            <View key={key} className={`border-t px-6 ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <Pressable
                onPress={() => toggleDetail(key)}
                className="flex-row justify-between items-center py-5"
              >
                <Text className={`font-geist font-bold text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
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
                  color={isDark ? "#f0f1f2" : "#000000"}
                  style={{ transform: [{ rotate: openDetails[key] ? "180deg" : "0deg" }] }}
                />
              </Pressable>
              {openDetails[key] && (
                <Text className={`font-inter text-sm pb-5 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {product.description}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Seller Info */}
        <View className="px-6 pt-10">
          <Text className={`text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Seller Information</Text>
          <View className="flex-row items-center gap-4 py-6">
            <Avatar
              uri={normalizeUri(product.seller?.profile_picture_url) ?? undefined}
              name={product.seller?.shop_name}
              size={64}
              className="rounded"
            />
            <View>
              <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{product.seller.shop_name}</Text>
              <Text className={`font-inter text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Average Rating: {product.seller.average_rating}</Text>
            </View>
          </View>
          <View className="flex-row justify-end pb-10">
            <Link href={`/shopDetails/${product.seller_id}`} asChild>
            <TouchableOpacity className="bg-primary h-12 rounded px-6 justify-center items-center">
              <Text className="text-white font-geist font-bold">View Shop</Text>
            </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View className={`h-4 ${isDark ? "bg-[#1a1c1d]" : "bg-surface"}`} />
      </ScrollView>

          {/* Title before similar products */}
          <Text className={`px-6 pt-10 pb-4 text-xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Other Similar Products
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <View className="px-4 pt-4 w-[50%]">
          <View className={`rounded overflow-hidden border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
            <Link href={`/productDetails/${item.id}`} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                {resolveMediaUri(item.images?.[0]?.media) ? (
                  <ImageBackground
                    source={{ uri: resolveMediaUri(item.images?.[0]?.media)! }}
                    className={`w-full aspect-square ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                    resizeMode="cover"
                  >
                    <View className={`absolute right-3 top-3 rounded px-3 py-1 border ${isDark ? "bg-[#1a1c1d]/90 border-[#46464e]" : "bg-white/90 border-border"}`}>
                      <Text className={`text-xs font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                        {formatNaira(item.price)}
                      </Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <View className={`w-full aspect-square items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                    <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No image</Text>
                  </View>
                )}
                <View className="px-4 pt-3 pb-4">
                  <Text className={`text-sm font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
            {role === "buyer" && (
              <View className="flex-row justify-between gap-3 px-4 pb-4">
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await addToCart({ product_id: item.id, variant_id: 0, quantity: 1 });
                      show({ variant: "success", title: "Added to cart", message: `${item.name} added.` });
                    } catch {
                      show({ variant: "error", title: "Could not add", message: "Please try again." });
                    }
                  }}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                >
                  <ShoppingCart size={14} color={isDark ? "#f0f1f2" : "#71717A"} />
                  <Text className={`text-[11px] font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/productDetails/${item.id}`)}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                >
                  <MessageCircle size={14} color={isDark ? "#f0f1f2" : "#71717A"} />
                  <Text className={`text-[11px] font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )
}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 4 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      onEndReached={getOtherProducts}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View className="py-5">
            <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? (
          <View className="items-center justify-center py-16">
            <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>No items yet</Text>
            <Text className={`text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Pull up to load more or create something new.
            </Text>
          </View>
        ) : null
      }
    />

    {canMessageSeller && product.seller_user && (
      <QuickChatBottomSheet
        sheetRef={ChatBottomSheetRef}
        sellerId={String(sellerUserId ?? product.seller_user.id)}
        buyerId={user?.user_id?.toString() ?? ""}
        product_id={product.id}
        otherUser={{
          username: product.seller_user.username,
          profile_picture: product.seller_user.profile_picture,
        }}
        asBuyer
      />
    )}
  </SafeAreaView>
);


}
