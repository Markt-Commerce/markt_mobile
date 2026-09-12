/**
 * Messages — Chat room list (Instagram/Twitter-style)
 */

import React, { useEffect, useState, useMemo } from "react";
import SearchField from "../../components/SearchField";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MessageCircle, Search } from "lucide-react-native";
import { getRooms } from "../../services/sections/chat";
import type { RoomListResponse } from "../../models/chat";
import Avatar from "../../components/Avatar";
import { useTokens } from "../../theme/useTokens";
// develop extracted this into a shared util; the local copy here was
// byte-identical, so take the shared one.
import { formatTimeAgo } from "../../utils/formatTimeAgo";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const t = useTokens();

  const fetchRooms = async () => {
    try {
      const res = await getRooms(1, 20);
      setData(res);
    } catch {
      setData({ rooms: [], pagination: undefined });
    } finally {
      setLoading(false);
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
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      <View className="border-b px-6 pt-6 pb-4 bg-surface-raised border-border">
        <Text className="text-2xl font-bold text-text-primary">Messages</Text>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations"
          className="mt-4"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-surface-raised">
          <ActivityIndicator size="large" color={t.textPrimary} />
        </View>
      ) : rooms.length > 0 ? (
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
                className="flex-row items-center px-6 py-5 border-b bg-surface-raised border-border"
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
                      className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded bg-primary-fill border-2 border-surface-page"
                    />
                  )}
                </View>
                <View className="flex-1 ml-4 min-w-0">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text
                      // Both hasUnread branches were already identical on
                      // develop; the name is always bold and unread is carried
                      // by the timestamp, preview and badge below.
                      className="font-bold text-base text-text-primary"
                      numberOfLines={1}
                    >
                      {item.other_user?.username ?? "Unknown"}
                    </Text>
                    <Text
                      className={`text-xs ${hasUnread ? ("text-text-primary font-bold") : ("text-text-secondary")}`}
                    >
                      {formatTimeAgo(item.last_message_at)}
                    </Text>
                  </View>
                  {item.product && (
                    <Text
                      className="text-xs mb-0.5 text-text-secondary"
                      numberOfLines={1}
                    >
                      Re: {item.product.name}
                    </Text>
                  )}
                  <Text
                    className={`text-sm ${hasUnread ? ("text-text-primary font-medium") : ("text-text-secondary")}`}
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
              tintColor={t.textPrimary}
            />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8 bg-surface-raised">
          <View className="mb-5">
            <MessageCircle size={44} color={t.textMuted} strokeWidth={1.5} />
          </View>
          <Text className="text-xl font-bold text-center text-text-primary">
            {search.trim() ? "No matches" : "No messages yet"}
          </Text>
          <Text className="text-base text-center mt-2 leading-6 text-text-secondary">
            {search.trim()
              ? "Try a different name or product"
              : 'Tap "Chat" on a product or "Message" on a request to start.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
