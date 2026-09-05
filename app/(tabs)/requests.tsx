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
    // Matches the cart's empty state, which was already right: a bare glyph,
    // the headline, one line of copy, one button. This had a bordered grey
    // square holding a bordered white square holding the icon -- two containers
    // around a single 28px picture -- and shouted its action in tracked
    // uppercase while the cart next door said "Start shopping" like a person.
    <View className="flex-1 items-center justify-center px-8 py-16">
      <FileText
        size={44}
        color={isDark ? "#8f9195" : "#000000"}
        strokeWidth={1.5}
      />
      <Text
        className={`text-[22px] font-bold text-center mt-5 text-text-primary`}
      >
        {title}
      </Text>
      <Text
        className={`text-[15px] text-center mt-2 leading-[21px] text-text-muted`}
      >
        {description}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        className="mt-6 h-12 px-7 rounded-xl bg-primary items-center justify-center"
      >
        <Text className="text-white font-semibold text-[15px]">{actionLabel}</Text>
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
      <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`mt-4 font-bold text-[11px] tracking-[2px] uppercase text-text-secondary`}>
            Loading requests
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      {/* No border under the header: the first row already draws a hairline,
          and two lines 4px apart read as a mistake. px-4 lines the title up
          with the rows beneath it instead of sitting 8px further in. */}
      <View className={`px-4 pt-4 pb-3 bg-surface-raised`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className={`font-bold text-[26px] tracking-tight text-text-primary`}>
              {isBuyer ? "My requests" : "Buyer requests"}
            </Text>
            <Text className={`text-[13px] mt-0.5 leading-[18px] text-text-muted`}>
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
          className={`flex-row items-center h-11 px-3 rounded-xl bg-surface-sunken`}
        >
          <Search size={17} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search requests"
            placeholderTextColor={isDark ? "#8f9195" : "#A1A1AA"}
            className={`flex-1 ml-2 text-[15px] text-text-primary`}
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
                      ? "bg-surface-sunken"
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
                        ? "text-text-secondary"
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
