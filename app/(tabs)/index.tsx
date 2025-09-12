import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ImageBackground,ActivityIndicator } from "react-native";
import { getProducts, getPosts } from "../../services/sections/feed";
import { FeedItem, Product, Post } from "../../models/feed";
import { Heart, MessageCircle, Send, Star } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import { getBuyerRequests } from "../../services/sections/feed";

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const {user,setUser} = useUser();

  const loadFeed = async () => {
    if (loading) return;
    setLoading(true);
  
    const options = ["product", "post"];
    if (user?.account_type === "seller") options.push("request"); // requests only for sellers
    const fetchType = options[Math.floor(Math.random() * options.length)];
    console.log("Fetching feed type:", fetchType);
  
    try {
      let newItems: FeedItem[] = [];
      if (fetchType === "product") {
        const products = await getProducts(page, 5);
        newItems = products.map((p) => ({ type: "product", data: p }));
      } else if (fetchType === "post") {
        const posts = await getPosts(page, 5);
        newItems = posts.map((p) => ({ type: "post", data: p }));
      } else {
        const requests = await getBuyerRequests(page, 5);
        newItems = requests.map((r) => ({ type: "request", data: r }));
      }
      setFeed((prev) => [...prev, ...newItems]);
      //setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    loadFeed();
  }, []);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === "request") {
      const req = item.data;
      return (
        <View className="p-4 border-b border-gray-200">
          {/* Buyer header */}
          <View className="flex-row items-center mb-2">
            <Image source={{ uri: req.buyer.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
            <Text className="font-semibold text-[#111418]">{req.buyer.username}</Text>
          </View>
          {/* Request details */}
          <Text className="font-bold text-[#111418] mb-1">{req.title}</Text>
          <Text className="text-[#60758a] mb-2">{req.description}</Text>
          <Text className="text-sm text-[#e26136] font-semibold">Budget: ${req.budget}</Text>
          <Text className="text-xs text-[#60758a]">Deadline: {new Date(req.deadline).toDateString()}</Text>
        </View>
      );
    } else if (item.type === "product") {
      const product = item.data;
      return (
        <View className="flex-row flex-wrap justify-between gap-3">
                <View className="w-[48%] pb-3">
                  <ImageBackground
                    source={{ uri: product.images?.[0]?.media?.original_url }}
                    className="aspect-square rounded-xl overflow-hidden"
                    resizeMode="cover"
                  />
                  <Text className="text-base font-medium text-[#171311] mt-2">{product.name}</Text>
                  <Text className="text-sm text-[#876d64]">{product.price}</Text>
                </View>
            </View>
      );
    } else {
      const post = item.data;
      return (
        <View className="p-4 border-b border-gray-200">
          {/* Post header */}
          <View className="flex-row items-center mb-2">
            <Image source={{ uri: post.seller?.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
            <Text className="font-semibold text-[#111418]">{post.seller?.shop_name}</Text>
          </View>
          {/* Post caption */}
          <Text className="mb-2">{post.caption}</Text>
          {/* Post media */}
          {post.social_media[0]?.media?.original_url && (
            <Image
              source={{ uri: post.social_media[0].media.original_url }}
              className="w-full h-48 rounded-lg"
            />
          )}
          {/* Actions */}
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
        </View>
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
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#e26136" /> : null}
      />
    </View>
  );
}



/* 
import React, { useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from "react-native";
import { Plus, ShoppingCart, LayoutGrid } from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import ProductFormBottomSheet from "../components/ProductFormBottomSheet";
import PostFormBottomSheet from "../components/PostFormBottomSheet";
import BuyerRequestFormBottomSheet from "../components/BuyerRequestFormBottomSheet";
import { FeedItem } from "../../models/feed";
import { getProducts, getPosts, getBuyerRequests } from "../../services/sections/feed";
import { useUser } from "../../models/userContextProvider";

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const { user } = useUser();

  // Bottom sheet refs
  const createMenuRef = useRef<BottomSheet>(null);
  const productFormRef = useRef<BottomSheet>(null);
  const postFormRef = useRef<BottomSheet>(null);
  const requestFormRef = useRef<BottomSheet>(null);

  const openMenu = () => createMenuRef.current?.expand();
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
        const products = await getProducts(page, 5);
        newItems = products.map((p) => ({ type: "product", data: p }));
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

  React.useEffect(() => {
    loadFeed();
  }, []);

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
        </View>
      );
    } else if (item.type === "product") {
      const product = item.data;
      return (
        <View className="flex-row flex-wrap justify-between gap-3">
          <View className="w-[48%] pb-3">
            <ImageBackground
              source={{ uri: product.images?.[0]?.media?.original_url }}
              className="aspect-square rounded-xl overflow-hidden"
              resizeMode="cover"
            />
            <Text className="text-base font-medium text-[#171311] mt-2">{product.name}</Text>
            <Text className="text-sm text-[#876d64]">{product.price}</Text>
          </View>
        </View>
      );
    } else {
      const post = item.data;
      return (
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center mb-2">
            <Image source={{ uri: post.seller?.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
            <Text className="font-semibold text-[#111418]">{post.seller?.shop_name}</Text>
          </View>
          <Text className="mb-2">{post.caption}</Text>
          {post.social_media[0]?.media?.original_url && (
            <Image source={{ uri: post.social_media[0].media.original_url }} className="w-full h-48 rounded-lg" />
          )}
          <View className="flex-row justify-between mt-2">
            <Text>❤️ {post.like_count}</Text>
            <Text>💬 {post.comment_count}</Text>
            <Text>⭐</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <TouchableOpacity>
          {user?.account_type === "buyer" ? (
            <ShoppingCart size={24} color="#111418" />
          ) : (
            <LayoutGrid size={24} color="#111418" />
          )}
        </TouchableOpacity>
        <Text className="text-lg font-bold">Feed</Text>
        <TouchableOpacity onPress={openMenu}>
          <Plus size={24} color="#e26136" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        onEndReached={loadFeed}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#e26136" /> : null}
      />

      <BottomSheet ref={createMenuRef} index={-1} snapPoints={["30%"]} enablePanDownToClose>
        <View className="p-4">
          <Text className="text-lg font-bold mb-3">Create</Text>
          <TouchableOpacity className="p-3 border-b" onPress={() => openForm("product")}>
            <Text>Create Product</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-3 border-b" onPress={() => openForm("post")}>
            <Text>Create Post</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-3" onPress={() => openForm("request")}>
            <Text>Create Buyer Request</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <ProductFormBottomSheet ref={productFormRef} onSubmit={(data) => console.log("Product", data)} />
      <PostFormBottomSheet ref={postFormRef} onSubmit={(data) => console.log("Post", data)} />
      <BuyerRequestFormBottomSheet ref={requestFormRef} onSubmit={(data) => console.log("Request", data)} />
    </View>
  );
}


*/