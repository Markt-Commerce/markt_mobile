/**
 * AppBar — Shared top bar (Markt style)
 *
 * Left: Profile avatar (opens drawer)
 * Center: Title
 * Right: Notifications
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import Avatar from "./Avatar";
import { useDrawer } from "../hooks/drawerContext";
import { useTheme } from "./themeProvider";

interface AppBarProps {
  title?: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
  avatarUri?: string | null;
  avatarName?: string | null;
}

export default function AppBar({
  title = "Markt",
  showAvatar = true,
  showNotifications = true,
  avatarUri = null,
  avatarName = null,
}: AppBarProps) {
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <View className="w-10 h-10 items-center justify-center">
        {showAvatar ? (
          <TouchableOpacity
            onPress={openDrawer}
            className="w-10 h-10 rounded overflow-hidden flex items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Avatar uri={avatarUri ?? undefined} name={avatarName ?? "User"} size={40} className="rounded" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <Text className={`text-2xl font-geist font-bold flex-1 text-center tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
        {title}
      </Text>
      <View className="w-10 h-10 items-center justify-center">
        {showNotifications ? (
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-1 -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={24} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.5} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
}
