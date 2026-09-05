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
import { useNotificationsBadge } from "../hooks/notificationsContext";

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
  const { unreadCount } = useNotificationsBadge();

  return (
    <View className={`flex-row items-center justify-between px-4 py-2 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <View className="w-9 h-9 items-center justify-center">
        {showAvatar ? (
          <TouchableOpacity
            onPress={openDrawer}
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
            style={{ borderRadius: 18 }}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Avatar uri={avatarUri ?? undefined} name={avatarName ?? "User"} size={36} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <Text className={`text-xl font-bold flex-1 text-center tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
        {title}
      </Text>
      <View className="w-9 h-9 items-center justify-center">
        {showNotifications ? (
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="p-1 -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <View>
              <Bell size={22} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <View
                  className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full items-center justify-center bg-primary border ${isDark ? "border-[#1a1c1d]" : "border-white"}`}
                >
                  <Text className="text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
}
