/**
 * Business tabs: Dashboard | Discover | Procurement | Orders | Chat
 *
 * Products, the business profile and settings hang off the top bar's account
 * button and the dashboard. Orders and Chat are the same screens as everyday
 * Markt — one inbox and one order history per account.
 */
import React, { useEffect } from "react";
import { Platform, Text, TouchableOpacity, View, type ColorValue } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRightLeft, Building2, ClipboardList, LayoutDashboard, MessageCircle, Receipt, Search, UserCog } from "lucide-react-native";
import { useBusiness } from "../../../hooks/businessContext";
import { useUnreadChats } from "../../../hooks/useUnreadChats";
import { useTokens } from "../../../theme/useTokens";
import { Loading } from "../../../components/business/ui";

function BusinessBar() {
  const router = useRouter();
  const t = useTokens();
  const { setMode, myBusiness } = useBusiness();

  const exit = async () => {
    await setMode("consumer");
    router.replace("/(tabs)");
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-surface-raised">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View className="w-9 h-9 rounded-xl items-center justify-center bg-primary-muted">
          <Building2 size={18} color={t.primaryText} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-primary-text">Markt Business</Text>
          <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
            {myBusiness?.profile?.name ?? "Business"}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={exit}
          accessibilityRole="button"
          accessibilityLabel="Switch to everyday Markt"
          className="h-9 px-3 rounded-full flex-row items-center gap-1.5 bg-surface-sunken"
        >
          <ArrowRightLeft size={14} color={t.textPrimary} strokeWidth={2} />
          <Text className="text-[12px] font-bold text-text-primary">Markt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/business/account")}
          accessibilityRole="button"
          accessibilityLabel="Business account"
          className="w-9 h-9 rounded-full items-center justify-center bg-surface-sunken"
        >
          <UserCog size={17} color={t.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BusinessTabsLayout() {
  const t = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config, myBusiness, refreshMyBusiness, setMode } = useBusiness();
  const { unreadRooms } = useUnreadChats();
  const [checked, setChecked] = React.useState(false);

  // Entering business mode remembers it; no profile yet means onboarding.
  useEffect(() => {
    void setMode("business");
    refreshMyBusiness().then((mine) => {
      setChecked(true);
      if (mine && (!mine.profile || !mine.business_tag)) router.replace("/business/onboarding");
    });
  }, []);

  if (!checked && !myBusiness) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page">
        <Loading />
      </SafeAreaView>
    );
  }

  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 2 : 0);
  const icon = (Icon: typeof Search) => ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Icon color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.5} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surfacePage }} edges={["top"]}>
      <BusinessBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { fontFamily: "Geist", fontSize: 9, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 },
          tabBarActiveTintColor: t.primaryText,
          tabBarInactiveTintColor: t.textSecondary,
          tabBarStyle: {
            backgroundColor: t.surfaceRaised,
            borderTopWidth: 1,
            borderTopColor: t.border,
            paddingTop: 6,
            paddingBottom: 2 + bottomInset,
            height: 60 + bottomInset,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarLabel: "Business", tabBarIcon: icon(LayoutDashboard) }} />
        <Tabs.Screen
          name="discover"
          options={{ title: "Discover", tabBarIcon: icon(Search), href: config.features.discovery_enabled ? undefined : null }}
        />
        <Tabs.Screen
          name="procurement"
          options={{
            title: "Procurement",
            tabBarLabel: "Requests",
            tabBarIcon: icon(ClipboardList),
            href: config.features.procurement_enabled ? undefined : null,
          }}
        />
        <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: icon(Receipt) }} />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarLabel: "Chat",
            tabBarIcon: icon(MessageCircle),
            tabBarBadge: unreadRooms > 0 ? (unreadRooms > 99 ? "99+" : unreadRooms) : undefined,
            tabBarBadgeStyle: { backgroundColor: t.primaryFill, color: t.textOnPrimary, fontSize: 10, fontWeight: "700" },
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
