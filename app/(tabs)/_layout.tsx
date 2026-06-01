/**
 * Tabs layout — Markt style
 *
 * App bar: profile avatar (drawer) | title | notifications
 * Tabs: Home | Search | Requests | Orders | Messages
 * Profile: hidden (reached via drawer)
 */
import React, { useState, useEffect } from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Search, FileText, ShoppingBag, MessageCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerProvider, useDrawer } from "../../hooks/drawerContext";
import { getUserProfile } from "../../services/sections/profile";
import AppBar from "../../components/AppBar";
import NavDrawer from "../../components/NavDrawer";
import type { UserProfile } from "../../models/profile";
import { useTheme } from "../../components/themeProvider";

const TAB_BAR_CONTENT_HEIGHT = 52;
const TAB_BAR_PADDING_TOP = 6;
const TAB_BAR_PADDING_BOTTOM = 2;
const SURFACE_WHITE = "#FFFFFF";
const SURFACE_BORDER = "#E4E4E7";
const TEXT_BLACK = "#000000";
const TEXT_MUTED = "#71717A";
const BRAND_PRIMARY = "#E94C2A";

function TabsWithDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 2 : 0);
  const tabBarHeight =
    TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP + TAB_BAR_PADDING_BOTTOM + tabBarBottomInset;

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => { });
  }, []);

  const displayName =
    profile?.current_role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "User";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : SURFACE_WHITE }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <AppBar
          title="Markt"
          avatarUri={profile?.profile_picture_url}
          avatarName={displayName}
        />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarShowLabel: true,
            tabBarLabelStyle: {
              fontFamily: "Geist",
              fontSize: 9,
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            },
            tabBarActiveTintColor: BRAND_PRIMARY,
            tabBarInactiveTintColor: isDark ? "#c6c5cf" : TEXT_MUTED,
            tabBarItemStyle: {
              flex: 1,
              paddingVertical: 0,
            },
            tabBarStyle: {
              backgroundColor: isDark ? "#1a1c1d" : SURFACE_WHITE,
              borderTopWidth: 1,
              borderTopColor: isDark ? "#46464e" : SURFACE_BORDER,
              paddingTop: TAB_BAR_PADDING_TOP,
              paddingBottom: TAB_BAR_PADDING_BOTTOM + tabBarBottomInset,
              height: tabBarHeight,
              paddingHorizontal: 8,
              elevation: 0,
              shadowColor: TEXT_BLACK,
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.04,
              shadowRadius: 16,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                <Home color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                <Search color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />

          <Tabs.Screen
            name="orders"
            options={{
              title: "Orders",
              tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                <ShoppingBag color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: "Messages",
              tabBarLabel: "Chat",
              tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                <MessageCircle color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="requests"
            options={{
              title: "Requests",
              tabBarLabel: "Requests",
              tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                <FileText color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="cart"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="buyerOrders"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="sellerOrders"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="sellerDashboard"
            options={{
              href: null,
            }}
          />
        </Tabs>
        <NavDrawer
          visible={isOpen}
          onClose={closeDrawer}
          profile={profile}
          onProfileLoaded={setProfile}
        />
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <DrawerProvider>
      <TabsWithDrawer />
    </DrawerProvider>
  );
}
