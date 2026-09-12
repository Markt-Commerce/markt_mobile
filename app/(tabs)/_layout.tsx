/**
 * Tabs layout — Markt style
 *
 * App bar: profile avatar (drawer) | title | notifications
 * Tabs: Home | Search | Requests | Orders | Messages
 * Profile: hidden (reached via drawer)
 */
import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Search, FileText, ShoppingBag, MessageCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerProvider, useDrawer } from "../../hooks/drawerContext";
import AppBar from "../../components/AppBar";
import NavDrawer from "../../components/NavDrawer";
import { useUser } from "../../hooks/userContextProvider";
import { useCart } from "../../hooks/cartContext";
import { useTokens } from "../../theme/useTokens";

const TAB_BAR_CONTENT_HEIGHT = 52;
const TAB_BAR_PADDING_TOP = 6;
const TAB_BAR_PADDING_BOTTOM = 2;

function TabsWithDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { profile } = useUser();
  const role = profile?.current_role;
  const { itemCount } = useCart();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 2 : 0);
  const tabBarHeight =
    TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP + TAB_BAR_PADDING_BOTTOM + tabBarBottomInset;

  const displayName =
    profile?.current_role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "User";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surfacePage }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <AppBar
          showLocation
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
            tabBarActiveTintColor: t.primaryText,
            tabBarInactiveTintColor: t.textSecondary,
            tabBarItemStyle: {
              flex: 1,
              paddingVertical: 0,
            },
            tabBarStyle: {
              backgroundColor: t.surfaceRaised,
              borderTopWidth: 1,
              borderTopColor: t.border,
              paddingTop: TAB_BAR_PADDING_TOP,
              paddingBottom: TAB_BAR_PADDING_BOTTOM + tabBarBottomInset,
              height: tabBarHeight,
              paddingHorizontal: 8,
              elevation: 0,
              shadowColor: "#000000", // a shadow is black in both themes
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
              tabBarIcon: ({ color, focused }) => (
                <Home color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color, focused }) => (
                <Search color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />

          <Tabs.Screen
            name="orders"
            options={{
              title: "Orders",
              // Cap the label rather than let a long number stretch the pill
              // and shove the tab layout around. undefined (not 0) hides it.
              tabBarBadge: itemCount > 0 ? (itemCount > 99 ? "99+" : itemCount) : undefined,
              tabBarBadgeStyle: {
                // primaryFill, not primary: white on #E94C2A is 3.80:1 and
                // fails AA in both themes.
                backgroundColor: t.primaryFill,
                color: t.textOnPrimary,
                fontSize: 10,
                fontWeight: "700",
                minWidth: 18,
                height: 18,
                lineHeight: 14,
                borderRadius: 9,
              },
              tabBarAccessibilityLabel:
                itemCount > 0
                  ? role === "seller"
                    ? `Orders, ${itemCount} ${itemCount === 1 ? "order needs" : "orders need"} your attention`
                    : `Orders, ${itemCount} ${itemCount === 1 ? "item" : "items"} in cart`
                  : "Orders",
              tabBarIcon: ({ color, focused }) => (
                <ShoppingBag color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: "Messages",
              tabBarLabel: "Chat",
              tabBarIcon: ({ color, focused }) => (
                <MessageCircle color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
              ),
            }}
          />
          <Tabs.Screen
            name="requests"
            options={{
              title: "Requests",
              tabBarLabel: "Requests",
              tabBarIcon: ({ color, focused }) => (
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
