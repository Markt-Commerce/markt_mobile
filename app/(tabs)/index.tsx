import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Plus, Bell, Search } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import type { FeedItem, FeedProduct } from "../../types/feed";
import { useUser } from "../../hooks/userContextProvider";
import ProductFormBottomSheet from "../../components/productCreateBottomSheet";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet"; //for buyer request reply chat
import { useToast } from "../../components/ToastProvider";
import StartCards from "../../components/startCards";
import FeedPostCard from "../../components/FeedPostCard";
import FeedProductCard from "../../components/FeedProductCard";
import ShopStrip from "../../components/ShopStrip";
import { useFeed } from "../../hooks/useFeed";
import { isFeedPost, isFeedProduct } from "../../types/feed";

const TABS = [
  { id: "for_you" as const, label: "For You" },
  { id: "discover" as const, label: "Discover" },
  { id: "trending" as const, label: "Trending" },
  { id: "following" as const, label: "Following" },
];

export default function FeedScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"for_you" | "discover" | "trending" | "following">("for_you");
  const [loadedStartCards, setLoadedStartCards] = useState(false);
  const { show } = useToast();

  const { role, user } = useUser();
  const { items, loading, loadingMore, hasNext, error, refresh, loadMore } = useFeed(selectedTab);
  const snapPoints = useMemo(() => ["30%"], []);

  // Bottom sheet refs
  const createMenuRef = useRef<BottomSheet>(null);
  const productFormRef = useRef<BottomSheet>(null);
  const postFormRef = useRef<BottomSheet>(null);
  const requestFormRef = useRef<BottomSheet>(null);

  const chatSheetRef = useRef<BottomSheet>(null);
  const productChatSheetRef = useRef<BottomSheet>(null);
  const [chatRoomOpen, setChatRoomOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
  const [productForChat, setProductForChat] = useState<FeedProduct | null>(null);

  // Shop strip collapse on scroll: hide when scrolling down, show when scrolling up
  const [stripCollapsed, setStripCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const stripHeight = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed

  useEffect(() => {
    Animated.timing(stripHeight, {
      toValue: stripCollapsed ? 0 : 1,
      duration: 200,
      useNativeDriver: false, // height/maxHeight requires false
    }).start();
  }, [stripCollapsed]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (dy > 8 && y > 60) setStripCollapsed(true);
    else if (dy < -8) setStripCollapsed(false);
  };

  const openProductChat = (product: FeedProduct) => {
    setProductForChat(product);
    productChatSheetRef.current?.expand();
  };

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

  useEffect(() => {
    refresh();
  }, [selectedTab]);

  useEffect(() => {
    if (!error) return;
    // Don't toast "Unauthorized" — we redirect to login; avoid spam from parallel 401s
    if (error.toLowerCase().includes("unauthorized")) return;
    show({ variant: "error", title: "Feed error", message: error });
  }, [error]);

  // Header Component (visuals only)
  const Header = () => (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
        <Text className="text-xl font-bold text-text-primary">Marketplace</Text>
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={openMenu}
            className="p-2.5 rounded-full bg-bg-muted"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Create new"
          >
            <Plus size={22} color="#171311" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-2.5 rounded-full bg-bg-muted"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={22} color="#171311" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.push("/search")}
          className="flex-row items-center bg-bg-muted rounded-full px-4 py-3"
          accessibilityRole="button"
          accessibilityLabel="Search products, posts, and sellers"
        >
          <Search size={18} color="#876d64" />
          <Text className="text-text-secondary ml-3 text-base">What are you looking for?</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          overflow: "hidden",
          maxHeight: stripHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 130],
          }),
        }}
      >
        <ShopStrip />
      </Animated.View>

      <View className="bg-white border-b border-border pb-1 mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 24 }}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSelectedTab(t.id)}
              className="py-2 min-h-[44px] justify-center relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === t.id }}
              accessibilityLabel={t.label}
            >
              <Text
                className={`font-semibold text-sm ${selectedTab === t.id ? "text-text-primary" : "text-text-secondary"}`}
              >
                {t.label}
              </Text>
              {selectedTab === t.id && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#e26136",
                    borderRadius: 1,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {role === "seller" && loadedStartCards && (
        <View className="bg-bg-muted">
          <StartCards onRemoved={() => setLoadedStartCards(false)} />
        </View>
      )}
    </>
  );

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (isFeedPost(item)) return <FeedPostCard post={item} />;
    if (isFeedProduct(item))
      return (
        <FeedProductCard
          product={item}
          onMessageSeller={openProductChat}
        />
      );
    return null;
  };


  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Header/>
      <FlatList
        className="bg-white"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => hasNext && loadMore()}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={refresh}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#e26136" />
              <Text className="text-text-secondary text-sm mt-2">Loading more…</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-16 px-6">
              <View className="w-20 h-20 rounded-full bg-bg-muted items-center justify-center mb-4">
                <Search size={32} color="#876d64" />
              </View>
              <Text className="text-text-primary font-semibold text-lg text-center">
                {selectedTab === "following" ? "Follow sellers to see their products" : "No items yet"}
              </Text>
              <Text className="text-text-secondary text-sm mt-2 text-center">
                Pull to refresh or tap + to create a post or product.
              </Text>
              <TouchableOpacity
                onPress={openMenu}
                className="mt-6 h-12 px-6 rounded-full bg-primary items-center justify-center min-h-[48px]"
                accessibilityRole="button"
                accessibilityLabel="Create something new"
              >
                <Text className="text-white font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <BottomSheet ref={createMenuRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView className="flex-1 p-4">
          <Text className="text-lg font-bold mb-4 text-text-primary">Create</Text>

          {role === "buyer" && (
            <>
              <TouchableOpacity onPress={() => openForm("request")} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Create Buyer Request</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Describe what you need and your budget.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Create Post</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Share updates, photos, or deals.</Text>
              </TouchableOpacity>
            </>
          )}
          {role === "seller" && (
            <>
              <TouchableOpacity onPress={() => openForm("product")} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Create Product</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Add a new item to your shop.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Create Post</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Share updates, photos, or deals.</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Imported Bottom Sheets */}
      <ProductFormBottomSheet ref={productFormRef} />
      <PostFormBottomSheet ref={postFormRef}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef}/>

      {chatRoomOpen && role === "seller" && (
        <QuickChatBottomSheet
          sellerId={user?.user_id || ""}
          buyerId={selectedBuyerId}
          sheetRef={chatSheetRef}
        />
      )}

      {productForChat && role === "buyer" && (
        <QuickChatBottomSheet
          sellerId={productForChat.seller.user.id}
          buyerId={user?.user_id || ""}
          sheetRef={productChatSheetRef}
        />
      )}
    </View>
  );
}
