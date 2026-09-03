/**
 * Requests — buyers manage their own requests, sellers browse open requests.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { FileText, Plus } from "lucide-react-native";
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

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestDisplayComponent
            req={item}
            onMessagePress={!isBuyer ? () => openChatWithBuyer(item) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyRequestsState
            title={isBuyer ? "No requests yet" : "No open requests"}
            description={
              isBuyer
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
