import React, { useRef, useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Plus, Bell, Search } from "lucide-react-native";
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
import { useToast } from "../../components/ToastProvider";
import StartCards from "../../components/startCards";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import RequestDisplayComponent from "../../components/requestDisplayComponent";
import ProductDisplayComponent from "../../components/productDisplayComponent";

export default function FeedScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedStartCards, setLoadedStartCards] = useState(false);
  const [page, setPage] = useState(1);
  const { show } = useToast();

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
    let fetchType = options[Itemchoice];
    if (!loadedStartCards) {
      //start cards are only loaded once at the start of the feed
      fetchType = "startCard";
      setLoadedStartCards(true);
    }

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

    {role === "seller" && <View >
      <StartCards />
      </View>}
    </>
  );

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === "request") {
      const req = item.data;
      return <RequestDisplayComponent req={req}/>; //todo: add message press event for requests
    } else if (item.type === "product") {
      const products = item.data;
      return <ProductDisplayComponent products={products}/> //todo: add in a add to cart functionality here as well as a message seller functionality
    } else {
      const post = item.data;
      return <PostDisplayComponent post={post} onLike={(postId)=> likePost(postId)}/>;
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
      <ProductFormBottomSheet ref={productFormRef} />
      <PostFormBottomSheet ref={postFormRef}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef}/>
    </SafeAreaView>
  );
}
