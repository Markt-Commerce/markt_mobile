import React, { useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from "react-native";
import { Plus, ShoppingCart, LayoutGrid, Heart, MessageCircle, Send, Star, MessageSquare } from "lucide-react-native";
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

  // Mock navigation / actions
  const goToPost = (postId: string) => console.log(`Navigate to /post/${postId}`);
  const goToProduct = (productId: string) => console.log(`Navigate to /product/${productId}`);
  const messageBuyer = (buyerId: string) => console.log(`Open chat with buyer ${buyerId}`);
  const addToCart = (productId: string) => console.log(`Add product ${productId} to cart`);

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
          <Text className="text-xs text-[#60758a] mb-2">Deadline: {new Date(req.deadline).toDateString()}</Text>
          {/* Message Button */}
          <TouchableOpacity onPress={() => messageBuyer(req.buyer.id)} className="mt-2 flex-row items-center">
            <MessageSquare size={20} color="#60758a" />
            <Text className="ml-1 text-[#60758a]">Message Buyer</Text>
          </TouchableOpacity>
        </View>
      );
    } 
    else if (item.type === "product") {
      const product = item.data;
      return (
        <TouchableOpacity onPress={() => goToProduct(product.id)} className="w-[48%] pb-3">
          <ImageBackground
            source={{ uri: product.images?.[0]?.media?.original_url }}
            className="aspect-square rounded-xl overflow-hidden"
            resizeMode="cover"
          />
          <Text className="text-base font-medium text-[#171311] mt-2">{product.name}</Text>
          <Text className="text-sm text-[#876d64]">{product.price}</Text>
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={() => addToCart(product.id)} className="flex-row items-center">
              <ShoppingCart size={20} color="#60758a" />
              <Text className="ml-1 text-[#60758a]">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => messageBuyer(product.seller?.id)} className="flex-row items-center">
              <MessageSquare size={20} color="#60758a" />
              <Text className="ml-1 text-[#60758a]">Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } 
    else {
      const post = item.data;
      return (
        <TouchableOpacity onPress={() => goToPost(post.id)} className="p-4 border-b border-gray-200">
          <View className="flex-row items-center mb-2">
            <Image source={{ uri: post.seller?.profile_picture_url }} className="w-10 h-10 rounded-full mr-2" />
            <Text className="font-semibold text-[#111418]">{post.seller?.shop_name}</Text>
          </View>
          <Text className="mb-2">{post.caption}</Text>
          {post.social_media[0]?.media?.original_url && (
            <Image source={{ uri: post.social_media[0].media.original_url }} className="w-full h-48 rounded-lg" />
          )}
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity className="flex-row items-center gap-2">
              <Heart size={20} color="#60758a" />
              <Text>{post.like_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-2">
              <MessageCircle size={20} color="#60758a" />
              <Text>{post.comment_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Send size={20} color="#60758a" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Star size={20} color="#60758a" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
