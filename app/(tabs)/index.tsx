import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, Compass } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useRouter, useFocusEffect } from "expo-router";
import type { FeedItem, FeedProduct } from "../../types/feed";
import { useUser } from "../../hooks/userContextProvider";
import { switchUserRole } from "../../services/sections/auth";
import { setUserSession } from "../../services/authStorage";
import ProductFormBottomSheet from "../../components/productCreateBottomSheet";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import CreateNicheBottomSheet from "../../components/nicheCreateBottomSheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet"; //for buyer request reply chat
import { useToast } from "../../components/ToastProvider";
import StartCards from "../../components/startCards";
import FeedPostCard from "../../components/FeedPostCard";
import FeedProductCard from "../../components/FeedProductCard";
import ShopStrip from "../../components/ShopStrip";
import { useFeed } from "../../hooks/useFeed";
import { isFeedPost, isFeedProduct } from "../../types/feed";
import { getMyNiches } from "../../services/sections/niches";
import { getUserProfile } from "../../services/sections/profile";
import type { Niches } from "../../models/niches";
import type { UserProfile } from "../../models/profile";

const MAIN_TABS = [
  { id: "for_you" as const, label: "For You" },
  { id: "discover" as const, label: "Discover" },
  { id: "trending" as const, label: "Trending" },
  { id: "following" as const, label: "Following" },
];

type TabId = "for_you" | "discover" | "trending" | "following" | string;

export default function FeedScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabId>("for_you");
  const [myNiches, setMyNiches] = useState<Niches[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadedStartCards, setLoadedStartCards] = useState(false);
  const { show } = useToast();

  const { role, user, setRole } = useUser();
  const feedTab = selectedTab;
  const { items, loading, loadingMore, hasNext, error, refresh, loadMore } = useFeed(feedTab);
  const snapPoints = useMemo(() => ["30%"], []);

  // Bottom sheet refs
  const createMenuRef = useRef<BottomSheet>(null);
  const productFormRef = useRef<BottomSheet>(null);
  const postFormRef = useRef<BottomSheet>(null);
  const requestFormRef = useRef<BottomSheet>(null);
  const nicheFormRef = useRef<BottomSheetMethods | null>(null);

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

  const openForm = (form: "product" | "post" | "request" | "niche") => {
    closeMenu();
    if (form === "product") productFormRef.current?.expand();
    if (form === "post") postFormRef.current?.expand();
    if (form === "request") requestFormRef.current?.expand();
    if (form === "niche") nicheFormRef.current?.expand?.();
  };

  const hasBothRoles = (profile?.is_buyer && profile?.is_seller) ?? false;

  const handleSwitchMode = async () => {
    closeMenu();
    try {
      const res = await switchUserRole();
      const newRole = (res.user?.current_role ?? res.current_role) as "buyer" | "seller";
      setRole(newRole);
      if (res.user?.email) {
        await setUserSession(
          { email: res.user.email, account_type: newRole, user_id: res.user.id },
          newRole
        );
      }
      show({ variant: "success", title: "Mode switched", message: `Now in ${newRole === "seller" ? "Seller" : "Buyer"} mode` });
    } catch (e) {
      // Switch fails when user doesn't have both accounts; offer Create account
      if (!profile?.is_seller) {
        show({ variant: "info", title: "Create seller account", message: "This action requires a seller account. Create one from Profile." });
        router.push("/(tabs)/profile");
      } else if (!profile?.is_buyer) {
        show({ variant: "info", title: "Create buyer account", message: "This action requires a buyer account. Create one from Profile." });
        router.push("/(tabs)/profile");
      } else {
        show({ variant: "error", title: "Could not switch", message: "Please try again." });
      }
    }
  };

  const handleCreateAccount = () => {
    closeMenu();
    router.push("/(tabs)/profile");
  };

  const fetchMyNiches = useCallback(async () => {
    try {
      const res = await getMyNiches(1, 20);
      setMyNiches(res.items.map((m) => m.niche));
    } catch {
      // ignore; niches optional for feed chips
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyNiches();
      getUserProfile().then(setProfile).catch(() => setProfile(null));
    }, [fetchMyNiches])
  );

  useEffect(() => {
    refresh();
  }, [selectedTab]);

  useEffect(() => {
    if (!error) return;
    // Don't toast "Unauthorized" — we redirect to login; avoid spam from parallel 401s
    if (error.toLowerCase().includes("unauthorized")) return;
    show({ variant: "error", title: "Feed error", message: error });
  }, [error]);

  // Header: shop strip + tabs (search lives in nav Search tab only to avoid duplicate)
  const Header = () => (
    <>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}
        >
          {MAIN_TABS.map((t) => (
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
          {myNiches.map((n) => (
            <TouchableOpacity
              key={n.id}
              onPress={() => setSelectedTab(n.id)}
              className="py-2 px-3 min-h-[44px] justify-center rounded-full bg-bg-muted relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === n.id }}
              accessibilityLabel={n.name}
            >
              <Text
                className={`font-semibold text-sm ${selectedTab === n.id ? "text-text-primary" : "text-text-secondary"}`}
                numberOfLines={1}
                style={{ maxWidth: 80 }}
              >
                {n.name}
              </Text>
              {selectedTab === n.id && (
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
          <TouchableOpacity
            onPress={() => router.push("/discoverNiches")}
            className="py-2 px-3 min-h-[44px] flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Explore communities"
          >
            <Compass size={18} color="#e26136" />
            <Text className="font-semibold text-sm text-primary">Explore</Text>
          </TouchableOpacity>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
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
                {role === "buyer"
                  ? "Pull to refresh or tap + to create a post or buyer request."
                  : "Pull to refresh or tap + to create a post or product."}
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
              <TouchableOpacity onPress={() => { closeMenu(); router.push("/(tabs)/requests"); }} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Make offer</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Browse requests and submit offers.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("niche")} className="border-b border-border-light py-4" activeOpacity={0.7}>
                <Text className="font-semibold text-base text-text-primary">Create community</Text>
                <Text className="text-xs text-text-secondary mt-0.5">Start a topic-based niche for your audience.</Text>
              </TouchableOpacity>
            </>
          )}
          {hasBothRoles ? (
            <TouchableOpacity onPress={handleSwitchMode} className="py-4" activeOpacity={0.7}>
              <Text className="font-semibold text-base text-primary">Switch mode</Text>
              <Text className="text-xs text-text-secondary mt-0.5">Change between Buyer and Seller.</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCreateAccount} className="py-4" activeOpacity={0.7}>
              <Text className="font-semibold text-base text-primary">
                {role === "buyer" && !profile?.is_seller
                  ? "Create seller account"
                  : role === "seller" && !profile?.is_buyer
                    ? "Create buyer account"
                    : "Switch mode"}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                {!profile?.is_seller
                  ? "Add a seller account to list products and manage a shop."
                  : !profile?.is_buyer
                    ? "Add a buyer account to browse and purchase."
                    : "Change between Buyer and Seller."}
              </Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Imported Bottom Sheets */}
      <ProductFormBottomSheet ref={productFormRef} />
      <PostFormBottomSheet ref={postFormRef}/>
      <BuyerRequestFormBottomSheet ref={requestFormRef}/>
      {role === "seller" && (
        <CreateNicheBottomSheet
          ref={nicheFormRef}
          onCreated={fetchMyNiches}
        />
      )}

      {/* FAB — bottom right, opens create menu */}
      <TouchableOpacity
        onPress={openMenu}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel="Create post or product"
      >
        <Plus size={26} color="white" />
      </TouchableOpacity>

      {chatRoomOpen && role === "seller" && (
        <QuickChatBottomSheet
          sellerId={user?.user_id ?? ""}
          buyerId={selectedBuyerId}
          asBuyer={false}
          sheetRef={chatSheetRef}
        />
      )}

      {productForChat && role === "buyer" && (
        <QuickChatBottomSheet
          sellerId={productForChat.seller.user.id}
          buyerId={user?.user_id ?? ""}
          product_id={productForChat.id}
          otherUser={{ username: productForChat.seller.user.username, profile_picture: productForChat.seller.user.profile_picture ?? undefined }}
          asBuyer
          sheetRef={productChatSheetRef}
        />
      )}
    </SafeAreaView>
  );
}
