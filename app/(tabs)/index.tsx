import React, { useRef, useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from "react-native";
import { Plus, ShoppingCart, MessageCircle, Heart, Send, Star } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Link } from "expo-router";
import { FeedItem } from "../../models/feed";
import { getProducts, getPosts, getBuyerRequests } from "../../services/sections/feed";
import { useUser } from "../../hooks/userContextProvider";
import ProductFormBottomSheet from "../../components/productCreateBottomSheet";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import { createPost } from "../../services/sections/post";
import { createProduct } from "../../services/sections/product";
import { createBuyerRequest } from "../../services/sections/request";
import { CreateProductRequest, PlaceholderProduct } from "../../models/products";
import { Category } from "../../models/categories";

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  //for create product
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);

  //for create post
  const [postCategories, setPostCategories] = useState<Category[]>([]);
  const [postProducts, setPostProducts] = useState<PlaceholderProduct[]>([]);

  const { role, setUser, user } = useUser();
  const snapPoints = useMemo(() => ["30%"], []);

  // Bottom sheet refs
  const createMenuRef = useRef<BottomSheet>(null);
  const productFormRef = useRef<BottomSheet>(null);
  const postFormRef = useRef<BottomSheet>(null);
  const requestFormRef = useRef<BottomSheet>(null);

  const openMenu = () => {
    console.log("Opening create menu");
    createMenuRef.current?.expand();
  }
  const closeMenu = () => createMenuRef.current?.close();

  const openForm = (form: "product" | "post" | "request") => {
    closeMenu();
    if (form === "product") productFormRef.current?.expand();
    if (form === "post") postFormRef.current?.expand();
    if (form === "request") requestFormRef.current?.expand();
  };

  const loadFeed = async () => {
    if (loading) return;
    setLoading(true);

    const options = ["product", "post"];
    if (user?.account_type === "seller") options.push("request");
    const fetchType = options[Math.floor(Math.random() * options.length)];

    try {
      let newItems: FeedItem[] = [];
      if (fetchType === "product") {
        const products = await getProducts(page, 6);
        const groupedProducts = [];
        for (let i = 0; i < products.length; i += 2) {
          groupedProducts.push(products.slice(i, i + 2));
        }
        newItems = groupedProducts.map((group) => ({ type: "product", data: group }));
      } else if (fetchType === "post") {
        const posts = await getPosts(page, 5);
        newItems = posts.map((p) => ({ type: "post", data: p }));
      } else {
        const requests = await getBuyerRequests(page, 5);
        newItems = requests.map((r) => ({ type: "request", data: r }));
      }
      setFeed((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Header Component
  const Header = () => (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <Text className="text-xl font-bold text-[#111418]">Marketplace</Text>
      <TouchableOpacity onPress={openMenu} className="p-2">
        <Plus size={28} color="#111418" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === "request") {
      const req = item.data;
      return (
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center mb-2">
            <Image source={{ uri: req.buyer.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
            <Text className="font-semibold text-[#111418]">{req.buyer.username}</Text>
          </View>
          <Text className="font-bold text-[#111418] mb-1">{req.title}</Text>
          <Text className="text-[#60758a] mb-2">{req.description}</Text>
          <Text className="text-sm text-[#e26136] font-semibold">Budget: ${req.budget}</Text>
          <Text className="text-xs text-[#60758a]">Deadline: {new Date(req.deadline).toDateString()}</Text>
          <TouchableOpacity className="mt-2 p-2 bg-[#e26136] rounded-lg">
            <Text className="text-white text-center">Message Buyer</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (item.type === "product") {
      const products = item.data;
      return (
        <View className="flex-row justify-between px-4 py-3">
          {products.map((product) => (
            <View key={product.id} className="w-[48%] pb-3">
              <Link href={`/productDetails/${product.id}`} asChild>
                <TouchableOpacity>
                  <ImageBackground
                    source={{ uri: product.images?.[0]?.media?.original_url }}
                    className="aspect-square rounded-xl overflow-hidden"
                    resizeMode="cover"
                  />
                  <Text className="text-base font-medium text-[#171311] mt-2">{product.name}</Text>
                  <Text className="text-sm text-[#876d64]">{product.price}</Text>
                </TouchableOpacity>
              </Link>
              <View className="flex-row justify-between mt-2">
                <TouchableOpacity className="flex-row items-center gap-1">
                  <ShoppingCart size={20} color="#60758a" />
                  <Text>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <MessageCircle size={20} color="#60758a" />
                  <Text>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      );
    } else {
      const post = item.data;
      return (
        <Link href={`/postDetails/${post.id}`} asChild>
          <TouchableOpacity className="p-4 border-b border-gray-200">
            <View className="flex-row items-center mb-2">
              <Image source={{ uri: post.seller?.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
              <Text className="font-semibold text-[#111418]">{post.seller?.shop_name}</Text>
            </View>
            <Text className="mb-2">{post.caption}</Text>
            {post.social_media[0]?.media?.original_url && (
              <Image source={{ uri: post.social_media[0].media.original_url }} className="w-full h-48 rounded-lg" />
            )}
            <View className="flex-row justify-between mt-2">
              <View className="flex-row items-center gap-2">
                <Heart size={20} color="#60758a" />
                <Text>{post.like_count}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MessageCircle size={20} color="#60758a" />
                <Text>{post.comment_count}</Text>
              </View>
              <Send size={20} color="#60758a" />
              <Star size={20} color="#60758a" />
            </View>
          </TouchableOpacity>
        </Link>
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={feed}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        onEndReached={loadFeed}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<Header />}
        stickyHeaderIndices={[0]}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#e26136" /> : null}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Create Menu Bottom Sheet */}
      <BottomSheet ref={createMenuRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="flex-1 p-4">
        <Text className="text-lg font-bold mb-4">Create</Text>

          {role === "buyer" && (
            <>
              <TouchableOpacity onPress={() => openForm("request")} className="border-b border-gray-200 p-15">
                <Text className="font-bold text-xl">Create Buyer Request</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-gray-200 p-15">
                <Text className="font-bold text-xl">Create Post</Text>
              </TouchableOpacity>
            </>
          )}
          {role === "seller" && (
            <>
              <TouchableOpacity onPress={() => openForm("product")} className="border-b border-gray-200 p-15">
                <Text className="font-bold text-xl">Create Product</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-gray-200 p-15">
                <Text className="font-bold text-xl">Create Post</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Imported Bottom Sheets */}
      <ProductFormBottomSheet ref={productFormRef} productCategories={productCategories} onSubmit={async (product) => {
        try {
          product.category_ids = productCategories.map((cat: any) => cat.id);
          const newProduct = await createProduct(product as CreateProductRequest);
          productFormRef.current?.close();
        } catch (error) {
          console.error("Error creating product:", error);
        }
      }}/>
      <PostFormBottomSheet ref={postFormRef} productCategories={productCategories} products={postProducts} onSubmit={async (data) => {
        try {
          data.category_ids = postCategories.map((cat) => cat.id);
          data.products = postProducts.map((prod) => { return { product_id: prod.id }; });
          const newPost = await createPost(data);
          //set feed later to show new post on top
          postFormRef.current?.close();
        } catch (error) {
          console.error("Error creating post:", error);
        }
      }}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef} onSubmit={async(request) => {
        try {
          const newRequest = await createBuyerRequest(request);
          requestFormRef.current?.close();
        } catch (error) {
          console.error("Error creating request:", error);
        }
      }}/>
    </View>
  );
}
