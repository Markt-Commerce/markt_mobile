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
import { useTokens } from "../theme/useTokens";
import { useNotificationsBadge } from "../hooks/notificationsContext";
import LocationSwitcher from "./location/LocationSwitcher";

interface AppBarProps {
  /** Replace the title with the browse-location switcher (the feed does). */
  showLocation?: boolean;
  title?: string;
  showAvatar?: boolean;
  showNotifications?: boolean;
  avatarUri?: string | null;
  avatarName?: string | null;
}

export default function AppBar({
  showLocation = false,
  title = "Markt",
  showAvatar = true,
  showNotifications = true,
  avatarUri = null,
  avatarName = null,
}: AppBarProps) {
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const t = useTokens();
  const { unreadCount } = useNotificationsBadge();

  return (
    <View className="flex-row items-center justify-between px-4 py-2 border-b bg-surface-raised border-border">
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
      {showLocation ? (
        // On the feed the app's own name is the least useful thing in the
        // header — the user knows which app they opened. Where they are
        // shopping is what they may want to change.
        <View className="flex-1 items-center">
          <LocationSwitcher />
        </View>
      ) : (
        <Text
          className="text-xl font-bold flex-1 text-center tracking-tight text-text-primary"
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
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
              <Bell size={22} color={t.textPrimary} strokeWidth={1.75} />
              {unreadCount > 0 && (
                // primary-fill, not primary: the badge carries a label, and
                // white on the brand swatch is 2.59:1 in dark. The border is
                // the bar behind it, so the badge reads as punched out of it.
                <View
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full items-center justify-center bg-primary-fill border border-surface-page"
                >
                  <Text className="text-[9px] font-bold text-text-on-primary">
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
