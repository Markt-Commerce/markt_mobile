/**
 * Requests — buyers manage their own requests, sellers browse open requests.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { FileText, Plus, Search } from "lucide-react-native";
import { useUser } from "../../hooks/userContextProvider";
import { getBuyerRequests } from "../../services/sections/feed";
import { BuyerRequest } from "../../models/feed";
import RequestDisplayComponent from "../../components/requestDisplayComponent";
import BuyerRequestFormBottomSheet from "../../components/buyerRequestBottomSheet";
import QuickChatBottomSheet from "../../components/quickChatBottomSheet";
import { useTheme } from "../../components/themeProvider";
import { getMyRequests } from "../../services/sections/request";

function EmptyRequestsState({
  title,
  description,
  actionLabel,
  onAction,
  isDark,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  isDark: boolean;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className={`w-24 h-24 rounded items-center justify-center mb-6 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
        <View className={`w-16 h-16 rounded items-center justify-center border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <FileText size={28} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.8} />
        </View>
      </View>
      <Text className={`text-2xl font-bold text-center tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        {title}
      </Text>
      <Text className={`text-base text-center mt-3 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
        {description}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        activeOpacity={0.85}
        className="mt-8 h-12 px-7 rounded bg-primary items-center justify-center"
      >
        <Text className="text-white font-bold text-[11px] tracking-[2px] uppercase">
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const { role, user } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isBuyer = role === "buyer";
  const [items, setItems] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestFormRef = useRef<BottomSheet>(null);
  const chatSheetRef = useRef<BottomSheet>(null);
  const [chatTarget, setChatTarget] = useState<BuyerRequest | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"open" | "all" | "closed">("open");

  const openChatWithBuyer = (req: BuyerRequest) => {
    setChatTarget(req);
    chatSheetRef.current?.expand();
  };

  const myId = user?.user_id ? String(user.user_id) : "";

  const fetchRequests = useCallback(async () => {
    try {
      const data = isBuyer ? await getMyRequests() : await getBuyerRequests(1, 20);
      // Sellers browsing requests shouldn't see the ones they created as a buyer.
      setItems(
        isBuyer
          ? data
          : data.filter((r) => String(r.user?.id ?? r.user_id) !== myId)
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isBuyer, myId]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const expired =
        !!r.expires_at && new Date(r.expires_at).getTime() < Date.now();
      const isOpen = (r.status ?? "OPEN").toUpperCase() === "OPEN" && !expired;
      if (filter === "open" && !isOpen) return false;
      if (filter === "closed" && isOpen) return false;
      if (!q) return true;
      return (
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.user?.username ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openCreateRequest = () => {
    requestFormRef.current?.expand();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`mt-4 font-bold text-[11px] tracking-[2px] uppercase ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Loading requests
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      {/* No border under the header: the first row already draws a hairline,
          and two lines 4px apart read as a mistake. px-4 lines the title up
          with the rows beneath it instead of sitting 8px further in. */}
      <View className={`px-4 pt-4 pb-3 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className={`font-bold text-[26px] tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              {isBuyer ? "My requests" : "Buyer requests"}
            </Text>
            <Text className={`text-[13px] mt-0.5 leading-[18px] ${isDark ? "text-[#8f9195]" : "text-tertiary"}`}>
              {isBuyer
                ? "Tell sellers what you need and let offers come to you."
                : "Open requests from buyers looking for what you sell."}
            </Text>
          </View>
          {isBuyer && (
            <TouchableOpacity
              onPress={openCreateRequest}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create a request"
              className="w-12 h-12 rounded-full bg-primary items-center justify-center"
            >
              <Plus size={22} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search and filters, as compact as the reference: the list is loaded
          in full, so filtering it locally is instant and needs no endpoint. */}
      <View className="px-4 pb-3">
        <View
          className={`flex-row items-center h-11 px-3 rounded-xl ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}
        >
          <Search size={17} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search requests"
            placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"}
            className={`flex-1 ml-2 text-[15px] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
            returnKeyType="search"
            accessibilityLabel="Search requests"
          />
        </View>

        <View className="flex-row gap-2 mt-3">
          {(["open", "all", "closed"] as const).map((key) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={`px-4 h-8 rounded-full items-center justify-center ${
                  active
                    ? isDark
                      ? "bg-[#f0f1f2]"
                      : "bg-black"
                    : isDark
                      ? "bg-[#2f3132]"
                      : "bg-[#F4F4F5]"
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold capitalize ${
                    active
                      ? isDark
                        ? "text-black"
                        : "text-white"
                      : isDark
                        ? "text-[#c6c5cf]"
                        : "text-[#52525B]"
                  }`}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestDisplayComponent
            req={item}
            onMessagePress={!isBuyer ? () => openChatWithBuyer(item) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyRequestsState
            title={
              query.trim()
                ? "Nothing matches"
                : filter === "closed"
                  ? "No closed requests"
                  : isBuyer
                    ? "No requests yet"
                    : "No open requests"
            }
            description={
              query.trim()
                ? "Try a different search, or switch the filter to All."
                : isBuyer
                  ? "Create a request to tell sellers what you need and let the right offers come to you."
                  : "Check back later for active buyer requests that match your category."
            }
            actionLabel={isBuyer ? "Create request" : "Browse feed"}
            onAction={isBuyer ? openCreateRequest : () => router.push("/(tabs)")}
            isDark={isDark}
          />
        }
        ListFooterComponent={<View className="h-8" />}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />
        }
      />

      {isBuyer && (
        <BuyerRequestFormBottomSheet ref={requestFormRef} onCreated={fetchRequests} />
      )}
      {!isBuyer && (
        <QuickChatBottomSheet
          sheetRef={chatSheetRef}
          buyerId={chatTarget?.user?.id ?? chatTarget?.user_id ?? ""}
          otherUser={
            chatTarget
              ? {
                  username: chatTarget.user?.username,
                  profile_picture: chatTarget.user?.profile_picture_url ?? undefined,
                }
              : undefined
          }
          asBuyer={false}
        />
      )}
    </SafeAreaView>
  );
}
