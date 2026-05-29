/**
 * Messages — Chat room list (Instagram/Twitter-style)
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { getRooms } from "../../services/sections/chat";
import type { RoomListResponse } from "../../models/chat";
import Avatar from "../../components/Avatar";
import { useTheme } from "../../components/themeProvider";

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function lastMessagePreview(lastMessage: { content?: string; message_type?: string } | undefined): string {
  if (!lastMessage) return "No messages yet";
  const type = lastMessage.message_type;
  if (type === "image") return "Photo";
  if (type === "video") return "Video";
  if (type === "product") return "Product shared";
  if (type === "offer") return "Price offer";
  const text = lastMessage.content ?? "";
  return text.length > 45 ? text.slice(0, 45) + "…" : text;
}

export default function MessagesScreen() {
  const [data, setData] = useState<RoomListResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const fetchRooms = async () => {
    try {
      const res = await getRooms(1, 20);
      setData(res);
    } catch {
      setData({ rooms: [], pagination: undefined });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const rooms = useMemo(() => {
    const list = data?.rooms ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.other_user?.username?.toLowerCase().includes(q) ||
        r.product?.name?.toLowerCase().includes(q)
    );
  }, [data?.rooms, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      <View className={`border-b px-6 pt-6 pb-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <Text className={`text-2xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Messages</Text>
        <View className={`flex-row items-center rounded mt-4 px-4 py-3 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
          <Search size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations"
            placeholderTextColor={isDark ? "#c6c5cf" : "#71717A"}
            className={`flex-1 ml-3 font-inter text-base py-0 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
          />
        </View>
      </View>

      {rooms.length > 0 ? (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const preview = lastMessagePreview(item.last_message);
            const hasUnread = item.unread_count > 0;
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/chat/[id]",
                    params: {
                      id: item.id,
                      username: item.other_user?.username,
                      profilePicture:
                        item.other_user?.profile_picture ??
                        item.other_user?.profile_picture_url ??
                        "",
                    },
                  })
                }
                activeOpacity={0.7}
                className={`flex-row items-center px-6 py-5 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
              >
                <View className="relative">
                  <Avatar
                    uri={item.other_user?.profile_picture ?? item.other_user?.profile_picture_url}
                    name={item.other_user?.username}
                    size={56}
                    className="rounded"
                  />
                  {hasUnread && (
                    <View
                      className={`absolute right-0 bottom-0 w-3.5 h-3.5 rounded bg-primary border-2 ${isDark ? "border-[#1a1c1d]" : "border-white"}`}
                    />
                  )}
                </View>
                <View className="flex-1 ml-4 min-w-0">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text
                      className={`font-geist font-bold text-base ${isDark ? (hasUnread ? "text-[#f0f1f2]" : "text-[#f0f1f2]") : (hasUnread ? "text-black" : "text-black")}`}
                      numberOfLines={1}
                    >
                      {item.other_user?.username ?? "Unknown"}
                    </Text>
                    <Text
                      className={`text-xs font-inter ${hasUnread ? (isDark ? "text-[#f0f1f2] font-bold" : "text-black font-bold") : (isDark ? "text-[#c6c5cf]" : "text-tertiary")}`}
                    >
                      {formatTimeAgo(item.last_message_at)}
                    </Text>
                  </View>
                  {item.product && (
                    <Text
                      className={`text-xs font-inter mb-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                      numberOfLines={1}
                    >
                      Re: {item.product.name}
                    </Text>
                  )}
                  <Text
                    className={`text-sm font-inter ${hasUnread ? (isDark ? "text-[#f0f1f2] font-medium" : "text-black font-medium") : (isDark ? "text-[#c6c5cf]" : "text-tertiary")}`}
                    numberOfLines={1}
                  >
                    {preview}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#f0f1f2" : "#000000"}
            />
          }
        />
      ) : (
        <View className={`flex-1 items-center justify-center px-8 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <View className={`w-24 h-24 rounded items-center justify-center mb-6 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
            <MessageCircle size={36} color={isDark ? "#f0f1f2" : "#000000"} />
          </View>
          <Text className={`text-xl font-geist font-bold text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {search.trim() ? "No matches" : "No messages yet"}
          </Text>
          <Text className={`font-inter text-base text-center mt-2 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {search.trim()
              ? "Try a different name or product"
              : 'Tap "Chat" on a product or "Message" on a request to start.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
