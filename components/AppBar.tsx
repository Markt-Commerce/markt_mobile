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

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
      <View className="w-10 h-10 items-center justify-center">
        {showAvatar ? (
          <TouchableOpacity
            onPress={openDrawer}
            className="w-10 h-10 rounded-full overflow-hidden"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Avatar uri={avatarUri ?? undefined} name={avatarName ?? "User"} size={40} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <Text className="text-xl font-bold text-text-primary flex-1 text-center" numberOfLines={1}>
        {title}
      </Text>
      <View className="w-10 h-10 items-center justify-center">
        {showNotifications ? (
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={22} color="#171311" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
}
