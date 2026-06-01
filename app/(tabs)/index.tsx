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
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter, useFocusEffect } from "expo-router";
import type { FeedItem, FeedProduct } from "../../types/feed";
import { useUser } from "../../hooks/userContextProvider";
import { switchUserRole } from "../../services/sections/auth";
import { setUserSession } from "../../services/authStorage";
import ProductFormBottomSheet from "../../components/productCreateBottomSheet";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import CreateNicheBottomSheet from "../../components/nicheCreateBottomSheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import { isOwnProductListing } from "../../utils/chatGuards";
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
import { useTheme } from "../../components/themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { role, user, setRole } = useUser();
  const feedTab = selectedTab;
  const { items, loading, loadingMore, hasNext, error, refresh, loadMore } = useFeed(feedTab);
  const snapPoints = useMemo(() => ["30%"], []);
  const [menuIndex, setMenuIndex] = useState(-1);

  // Bottom sheet refs
  const createMenuRef = useRef<BottomSheet>(null);
  const productFormRef = useRef<BottomSheet>(null);
  const postFormRef = useRef<BottomSheet>(null);
  const requestFormRef = useRef<BottomSheet>(null);
  const nicheFormRef = useRef<BottomSheet>(null);

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
    const sellerUserId = product.seller?.user?.id;
    if (isOwnProductListing(user?.user_id, sellerUserId)) {
      show({
        variant: "info",
        title: "Cannot chat",
        message: "You cannot message yourself about your own product.",
      });
      return;
    }
    setProductForChat(product);
    productChatSheetRef.current?.expand();
  };

  const openMenu = () => setMenuIndex(0);
  const closeMenu = () => setMenuIndex(-1);
  const toggleMenu = () => setMenuIndex((current) => (current === -1 ? 0 : -1));
  const handleMenuChange = useCallback((index: number) => setMenuIndex(index), []);
  const renderMenuBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

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

      <View className={`border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 16 }}
        >
          {MAIN_TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSelectedTab(t.id)}
              className="py-1 relative"
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === t.id }}
              accessibilityLabel={t.label}
            >
              <Text
                className={`font-geist font-bold text-[13px] tracking-widest uppercase ${selectedTab === t.id ? "text-primary" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
              >
                {t.label}
              </Text>
              {selectedTab === t.id && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#E94C2A",
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
          {myNiches.map((n) => (
            <TouchableOpacity
              key={n.id}
              onPress={() => setSelectedTab(n.id)}
              className={`py-1 px-4 rounded relative ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === n.id }}
              accessibilityLabel={n.name}
            >
              <Text
                className={`font-geist font-bold text-[10px] tracking-widest uppercase ${selectedTab === n.id ? "text-primary" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                numberOfLines={1}
                style={{ maxWidth: 100 }}
              >
                {n.name}
              </Text>
              {selectedTab === n.id && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -5,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#E94C2A",
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push("/discoverNiches")}
            className="py-1 px-3 flex-row items-center gap-2"
            accessibilityRole="button"
            accessibilityLabel="Explore communities"
          >
            <Compass size={16} color="#E94C2A" strokeWidth={2} />
            <Text className="font-geist font-bold text-[13px] tracking-widest uppercase text-primary">Explore</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {role === "seller" && loadedStartCards && (
        <View className={`py-4 px-4 ${isDark ? "bg-[#1a1c1d]" : "bg-surface"}`}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right"]}>
      <Header />
      <FlatList
        className={isDark ? "bg-[#1a1c1d]" : "bg-white"}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => hasNext && loadMore()}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={<View className="h-4" />}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-2 items-center">
              <ActivityIndicator size="small" color="#E94C2A" />
              <Text className={`font-geist font-bold text-[10px] tracking-widest uppercase mt-4 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Discovering more content</Text>
            </View>
          ) : <View className="h-10" />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-12 px-8">
              <View className={`w-24 h-24 rounded items-center justify-center mb-8 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
                <Search size={40} color={isDark ? "#f0f1f2" : "#A1A1AA"} strokeWidth={1} />
              </View>
              <Text className={`font-geist font-bold text-2xl text-center leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                {selectedTab === "following" ? "Expand your\ncommunity" : "The gallery is\nempty for now"}
              </Text>
              <Text className={`font-inter text-base mt-4 text-center leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {role === "buyer"
                  ? "Explore trending creators or discover unique products curated just for you."
                  : "Start building your presence. Post your first product or share a story."}
              </Text>
              <TouchableOpacity
                onPress={openMenu}
                className="mt-10 h-14 px-12 rounded bg-primary items-center justify-center"
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Create something new"
              >
                <Text className="text-white font-geist font-bold text-sm tracking-widest uppercase">Begin Creating</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <BottomSheet
        ref={createMenuRef}
        index={menuIndex}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderMenuBackdrop}
        onChange={handleMenuChange}
        backgroundStyle={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}
        handleIndicatorStyle={{ backgroundColor: isDark ? "#46464e" : "#E4E4E7" }}
      >
        <BottomSheetView className={`flex-1 p-4 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <Text className={`text-lg font-bold mb-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create</Text>

          {role === "buyer" && (
            <>
              <TouchableOpacity onPress={() => openForm("request")} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Buyer Request</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Describe what you need and your budget.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Post</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Share updates, photos, or deals.</Text>
              </TouchableOpacity>
            </>
          )}
          {role === "seller" && (
            <>
              <TouchableOpacity onPress={() => openForm("product")} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Product</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Add a new item to your shop.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("post")} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create Post</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Share updates, photos, or deals.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { closeMenu(); router.push("/(tabs)/requests"); }} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Make offer</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Browse requests and submit offers.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openForm("niche")} className={`border-b py-4 ${isDark ? "border-[#46464e]" : "border-border"}`} activeOpacity={0.7}>
                <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Create community</Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Start a topic-based niche for your audience.</Text>
              </TouchableOpacity>
            </>
          )}
          {hasBothRoles ? (
            <TouchableOpacity onPress={handleSwitchMode} className="py-4" activeOpacity={0.7}>
              <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Switch mode</Text>
              <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Change between Buyer and Seller.</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCreateAccount} className="py-4" activeOpacity={0.7}>
              <Text className={`font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                {role === "buyer" && !profile?.is_seller
                  ? "Create seller account"
                  : role === "seller" && !profile?.is_buyer
                    ? "Create buyer account"
                    : "Switch mode"}
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
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
      <PostFormBottomSheet ref={postFormRef} />
      <BuyerRequestFormBottomSheet ref={requestFormRef} />
      {role === "seller" && (
        <CreateNicheBottomSheet
          ref={nicheFormRef}
          onCreated={fetchMyNiches}
        />
      )}

      {/* FAB — bottom right, opens create menu */}
      <TouchableOpacity
        onPress={toggleMenu}
        className="absolute bottom-10 right-4 w-14 h-14 rounded bg-primary items-center justify-center shadow-lg"
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
