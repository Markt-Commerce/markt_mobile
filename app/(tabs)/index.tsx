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
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [postImages, setpostImages] = useState<string[]>([]);

  //for request
  const [requestImages, setRequestImages] = useState<string[]>([]);

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
  };
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
        const posts = await getPosts(page, 7);
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

  // Header Component (visuals only)
  const Header = () => (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-[#f0e9e7]">
      <Text className="text-xl font-extrabold text-[#111418]">Marketplace</Text>
      <TouchableOpacity onPress={openMenu} className="p-2 rounded-full bg-[#f5f2f1]" hitSlop={{top:8,bottom:8,left:8,right:8}}>
        <Plus size={22} color="#111418" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === "request") {
      const req = item.data;
      return (
        <View className="px-4 pt-3">
          <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
            <View className="flex-row items-center mb-3">
              <Image source={{ uri: req.buyer.profile_picture_url }} className="w-10 h-10 rounded-full mr-3" />
              <View>
                <Text className="font-semibold text-[#111418]">{req.buyer.username}</Text>
                <Text className="text-xs text-[#876d64]">Buyer request</Text>
              </View>
            </View>

            <Text className="font-bold text-[#111418] text-[16px] mb-1" numberOfLines={2}>
              {req.title}
            </Text>
            <Text className="text-[#60758a] mb-3" numberOfLines={3}>
              {req.description}
            </Text>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-[#e26136] font-semibold">Budget: ${req.budget}</Text>
                <Text className="text-[11px] text-[#60758a]">Deadline: {new Date(req.deadline).toDateString()}</Text>
              </View>
              <TouchableOpacity className="px-3 py-2 bg-[#e26136] rounded-full">
                <Text className="text-white text-sm font-semibold">Message Buyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    } else if (item.type === "product") {
      const products = item.data;
      return (
        <View className="px-4 pt-3">
          <View className="flex-row justify-between gap-3">
            {products.map((product) => (
              <View key={product.id} className="w-[48%]">
                <Link href={`/productDetails/${product.id}`} asChild>
                  <TouchableOpacity activeOpacity={0.85}>
                    <View className="rounded-2xl overflow-hidden border border-[#efe9e7] bg-white">
                      <ImageBackground
                        source={{ uri: product.images?.[0]?.media?.original_url }}
                        className="w-full aspect-square"
                        resizeMode="cover"
                      >
                        {/* price pill */}
                        <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
                          <Text className="text-[12px] font-semibold text-[#111418]">
                            {product.price}
                          </Text>
                        </View>
                      </ImageBackground>

                      <View className="px-3 pt-2 pb-3">
                        <Text className="text-[14px] font-semibold text-[#171311]" numberOfLines={1}>
                          {product.name}
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
            ))}
          </View>
        </View>
      );
    } else {
      const post = item.data;
      return (
        <Link href={`/postDetails/${post.id}`} asChild>
          <TouchableOpacity activeOpacity={0.85} className="px-4 pt-3">
            <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
              <View className="flex-row items-center mb-3">
                <Image source={{ uri: post.seller?.profile_picture_url }} className="w-10 h-10 rounded-full mr-3" />
                <View>
                  <Text className="font-semibold text-[#111418]">{post.seller?.shop_name}</Text>
                  <Text className="text-xs text-[#876d64]">Shop post</Text>
                </View>
              </View>

              {post.caption ? (
                <Text className="mb-3 text-[#111418]" numberOfLines={3}>{post.caption}</Text>
              ) : null}

              {post.social_media[0]?.media?.original_url && (
                <Image
                  source={{ uri: post.social_media[0].media.original_url }}
                  className="w-full h-56 rounded-xl"
                />
              )}

              <View className="flex-row justify-between mt-3">
                <View className="flex-row items-center gap-2">
                  <Heart size={18} color="#60758a" />
                  <Text className="text-[#111418]">{post.like_count}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <MessageCircle size={18} color="#60758a" />
                  <Text className="text-[#111418]">{post.comment_count}</Text>
                </View>
                <Send size={18} color="#60758a" />
                <Star size={18} color="#60758a" />
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={feed}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        onEndReached={loadFeed}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<Header />}
        stickyHeaderIndices={[0]}
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
              <Text className="text-[#876d64] text-sm mt-1">Pull up to load more or create something new.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Create Menu Bottom Sheet (visual tweaks only) */}
      <BottomSheet ref={createMenuRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="flex-1 p-4">
          <Text className="text-lg font-extrabold mb-2 text-[#111418]">Create</Text>

          {/* kept your role gating & onPress handlers exactly the same */}
          {role === "buyer" && (
            <>
              <TouchableOpacity onPress={() => openForm("request")} className="border-b border-[#f0e9e7] py-4" hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text className="font-semibold text-[16px] text-[#171311]">Create Buyer Request</Text>
                <Text className="text-xs text-[#876d64]">Describe what you need and your budget.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-[#f0e9e7] py-4" hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text className="font-semibold text-[16px] text-[#171311]">Create Post</Text>
                <Text className="text-xs text-[#876d64]">Share updates, photos, or deals.</Text>
              </TouchableOpacity>
            </>
          )}
          {role === "seller" && (
            <>
              <TouchableOpacity onPress={() => openForm("product")} className="border-b border-[#f0e9e7] py-4" hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text className="font-semibold text-[16px] text-[#171311]">Create Product</Text>
                <Text className="text-xs text-[#876d64]">Add a new item to your shop.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-[#f0e9e7] py-4" hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text className="font-semibold text-[16px] text-[#171311]">Create Post</Text>
                <Text className="text-xs text-[#876d64]">Share updates, photos, or deals.</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Imported Bottom Sheets */}
      <ProductFormBottomSheet ref={productFormRef} productCategories={productCategories} onSubmit={async (product) => {
        try {
          const newProduct = await createProduct(product as CreateProductRequest);
          productFormRef.current?.close();
        } catch (error) {
          console.error("Error creating product:", error);
        }
      }}/>
      <PostFormBottomSheet ref={postFormRef} productCategories={productCategories} products={postProducts} postImages={postImages} onSubmit={async (data) => {
        try {
          data.products = postProducts.map((prod) => { return { product_id: prod.id }; });
          const newPost = await createPost(data);
          console.log("post: ",newPost)
          //set feed later to show new post on top
          postFormRef.current?.close();
        } catch (error) {
          console.error("Error creating post:", error);
        }
      }}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef} requestImages={requestImages} onSubmit={async(request) => {
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
