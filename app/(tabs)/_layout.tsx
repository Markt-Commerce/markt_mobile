/**
 * Tabs layout — Markt style
 *
 * App bar: profile avatar (drawer) | title | notifications
 * Tabs: Home | Search | Requests | Orders | Messages
 * Profile: hidden (reached via drawer)
 */
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, FileText, ShoppingBag, MessageCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerProvider, useDrawer } from "../../hooks/drawerContext";
import { getUserProfile } from "../../services/sections/profile";
import AppBar from "../../components/AppBar";
import NavDrawer from "../../components/NavDrawer";
import type { UserProfile } from "../../models/profile";

function TabsWithDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const displayName =
    profile?.current_role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "User";

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <AppBar
          title="Markt"
          avatarUri={profile?.profile_picture_url}
          avatarName={displayName}
        />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
            tabBarActiveTintColor: "#e26136",
            tabBarInactiveTintColor: "#876d64",
            tabBarStyle: {
              backgroundColor: "white",
              borderTopWidth: 1,
              borderTopColor: "#efe9e7",
              paddingBottom: 8,
              paddingTop: 6,
              height: 64,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={22} />,
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarIcon: ({ color }: { color: string }) => <Search color={color} size={22} />,
            }}
          />
          <Tabs.Screen
            name="requests"
            options={{
              title: "Requests",
              tabBarIcon: ({ color }: { color: string }) => <FileText color={color} size={22} />,
            }}
          />
          <Tabs.Screen
            name="orders"
            options={{
              title: "Orders",
              tabBarIcon: ({ color }: { color: string }) => <ShoppingBag color={color} size={22} />,
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: "Messages",
              tabBarIcon: ({ color }: { color: string }) => <MessageCircle color={color} size={22} />,
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
