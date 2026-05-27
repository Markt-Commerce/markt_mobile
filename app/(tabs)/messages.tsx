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
import { Search } from "lucide-react-native";
import { getRooms } from "../../services/sections/chat";
import type { RoomListResponse } from "../../models/chat";
import Avatar from "../../components/Avatar";

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
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <View className="bg-white border-b border-[#efefef] px-4 pt-4 pb-3">
        <Text className="text-[22px] font-bold text-[#1a1a1a]">Messages</Text>
        <View className="flex-row items-center bg-[#efefef] rounded-[10px] mt-3 px-3 py-2.5">
          <Search size={18} color="#8e8e8e" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations"
            placeholderTextColor="#8e8e8e"
            className="flex-1 ml-2 text-[#1a1a1a] text-[15px] py-0"
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
                className="bg-white flex-row items-center px-4 py-3.5 border-b border-[#efefef]"
              >
                <View className="relative">
                  <Avatar
                    uri={item.other_user?.profile_picture ?? item.other_user?.profile_picture_url}
                    name={item.other_user?.username}
                    size={56}
                  />
                  {hasUnread && (
                    <View
                      className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"
                    />
                  )}
                </View>
                <View className="flex-1 ml-4 min-w-0">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text
                      className="text-[#1a1a1a] font-semibold text-[15px]"
                      numberOfLines={1}
                    >
                      {item.other_user?.username ?? "Unknown"}
                    </Text>
                    <Text
                      className={`text-[12px] ${hasUnread ? "text-primary font-semibold" : "text-[#8e8e8e]"}`}
                    >
                      {formatTimeAgo(item.last_message_at)}
                    </Text>
                  </View>
                  {item.product && (
                    <Text
                      className="text-[12px] text-[#8e8e8e] mb-0.5"
                      numberOfLines={1}
                    >
                      Re: {item.product.name}
                    </Text>
                  )}
                  <Text
                    className={`text-[14px] ${hasUnread ? "text-[#1a1a1a] font-medium" : "text-[#8e8e8e]"}`}
                    numberOfLines={1}
                  >
                    {preview}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e26136"
            />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-[#efefef] items-center justify-center mb-4">
            <Text className="text-4xl">💬</Text>
          </View>
          <Text className="text-[#1a1a1a] text-lg font-bold text-center">
            {search.trim() ? "No matches" : "No messages yet"}
          </Text>
          <Text className="text-[#8e8e8e] text-sm text-center mt-1.5">
            {search.trim()
              ? "Try a different name or product"
              : 'Tap "Chat" on a product or "Message" on a request to start.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
