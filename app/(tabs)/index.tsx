import React, { useRef, useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ImageBackground, ActivityIndicator, Pressable } from "react-native";
import { Plus, ShoppingCart, MessageCircle, Heart, Send, Star, Bell, Search } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Link, useRouter } from "expo-router";
import { FeedItem } from "../../models/feed";
import { getProducts, getPosts, getBuyerRequests } from "../../services/sections/feed";
import { useUser } from "../../hooks/userContextProvider";
import ProductFormBottomSheet from "../../components/productCreateBottomSheet";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { createPost,likePost } from "../../services/sections/post";
import { createProduct } from "../../services/sections/product";
import { createBuyerRequest } from "../../services/sections/request";
import { CreateProductRequest, PlaceholderProduct } from "../../models/products";
import { Category } from "../../models/categories";
import { useToast } from "../../components/ToastProvider";
import StartCards from "../../components/startCards";

export default function FeedScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedStartCards, setLoadedStartCards] = useState(false);
  const [page, setPage] = useState(1);
  const { show } = useToast();

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
    if (role === "seller") options.push("request");
    const Itemchoice = Math.floor(Math.random() * options.length);
        console.log("Item choice number: ",Itemchoice)
    let fetchType = options[Itemchoice];
    if (!loadedStartCards) {
      //start cards are only loaded once at the start of the feed
      fetchType = "startCard";
      setLoadedStartCards(true);
    }

    try {
      let newItems: FeedItem[] = [];
      if (fetchType === "startCard") {
        //load start cards
        newItems = [{ type: "startCard", data: [] }]; //start cards component can handle its own data fetching with population
      }
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
      show({
        variant: "error",
        title: "Error loading feed",
        message: "There was a problem loading the feed. Please try again later."
      })
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);


  //social functions


  // Header Component (visuals only)
  const Header = () => (
    <>
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-[#f0e9e7]">
      <Text className="text-xl font-extrabold text-[#111418]">Marketplace</Text>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={openMenu} className="p-2 rounded-full bg-[#f5f2f1] mx-1" hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Plus size={22} color="#111418" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/notifications')} className="p-2 rounded-full bg-[#f5f2f1] mx-1" hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Bell size={22} color="#111418" />
      </TouchableOpacity>
      </View>
    </View>
    <View className="px-4 py-3 bg-white border-b border-[#f0e9e7]">
      {/* search bar but like button that leads to search page */}
      <TouchableOpacity onPress={() => router.push('/search')} className="p-2 rounded-full bg-[#f5f2f1] mx-1" hitSlop={{top:8,bottom:8,left:8,right:8}}>
        {/* button that looks like a search bar */}
        <View className="flex-row items-center bg-[#f5f2f1] rounded-full px-3 py-1">
          <Search size={18} color="#886963" />
          <Text className="text-[#886963] ml-2">What are you looking for?</Text>
        </View>
      </TouchableOpacity>
    </View>
    </>
  );

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === "request") {
      const req = item.data;
      return (
        <View className="px-4 pt-3">
          <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
            <View className="flex-row items-center mb-3">
              <Image source={{ uri: req.buyer?.profile_picture_url }} className="w-10 h-10 rounded-full mr-3" />
              <View>
                <Text className="font-semibold text-[#111418]">{req.buyer?.username}</Text>
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
    } else if (item.type === "post"){
      const post = item.data;
      return (
        <Link href={`/postDetails/${post.id}`} asChild>
          <TouchableOpacity activeOpacity={0.85} className="px-4 pt-3">
            <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
              <View className="flex-row items-center mb-3">
                <Image source={{ uri: post.user?.profile_picture_url.length > 0 ? post.user?.profile_picture_url : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }} className="w-10 h-10 rounded-full mr-3" />
                <View>
                  <Text className="font-semibold text-[#111418]">{post.user?.username}</Text> {/* Ask the backend to provide the actual name i.e shop or buyer name to include here */}
                  <Text className="text-xs text-[#876d64]">Post</Text>
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
                <Pressable className="flex-row items-center gap-2" onPress={async ()=>{
                  try {
                    //work on this later... liking should be toggled for each post
                    const res = await likePost(post.id);
                    post.like_count++;
                  } catch (error) {
                   console.error("unable to like this post") 
                  }
                }}>
                  <Heart size={18} color="#60758a" />
                  <Text className="text-[#111418]">{post.like_count}</Text>
                </Pressable>
                <Pressable className="flex-row items-center gap-2">
                  <MessageCircle size={18} color="#60758a" />
                  <Text className="text-[#111418]">{post.comment_count}</Text>
                </Pressable>
                <Pressable>
                  <Send size={18} color="#60758a" />
                </Pressable>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      );
    }
    else {
      return <StartCards />;
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

      <BottomSheet ref={createMenuRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="flex-1 p-4">
          <Text className="text-lg font-extrabold mb-2 text-[#111418]">Create</Text>

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
          show({
            variant: "success",
            title: "Product Created",
            message: "Your product has been successfully created."
          });
          productFormRef.current?.close();
        } catch (error) {
          show({
            variant: "error",
            title: "Error creating product",
            message: "There was a problem creating the product. Please try again later."
          });
        }
      }}/>
      <PostFormBottomSheet ref={postFormRef} productCategories={productCategories} products={postProducts} postImages={postImages} onSubmit={async (data) => {
        try {
          data.products = postProducts.map((prod) => { return { product_id: prod.id }; });
          const newPost = await createPost(data);
          show({
            variant: "success",
            title: "Post Created",
            message: "Your post has been successfully created."
          });
          //set feed later to show new post on top
          postFormRef.current?.close();
        } catch (error) {
          show({
            variant: "error",
            title: "Error creating post",
            message: "There was a problem creating the post. Please try again later."
          });
        }
      }}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef} requestImages={requestImages} onSubmit={async(request) => {
        try {
          const newRequest = await createBuyerRequest(request);
          show({
            variant: "success",
            title: "Request Created",
            message: "Your request has been successfully created."
          });
          requestFormRef.current?.close();
        } catch (error) {
          show({
            variant: "error",
            title: "Error creating buyer request",
            message: "There was a problem creating the buyer request. Please try again later."
          });
        }
      }}/>
    </SafeAreaView>
  );
}
