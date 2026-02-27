import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, ChevronRight } from "lucide-react-native";
import { useToast } from "../components/ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import { getMyNiches } from "../services/sections/niches";
import { Niches } from "../models/niches";
import CreateNicheBottomSheet from "../components/nicheCreateBottomSheet";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

export default function MyNichesScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { role } = useUser();
  const nicheFormRef = useRef<BottomSheetMethods | null>(null);
  const [niches, setNiches] = useState<Niches[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNiches = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await getMyNiches(pageNum, 10);
        const nicheList = response.items.map((m) => m.niche);
        if (isRefresh) {
          setNiches(nicheList);
          setPage(1);
        } else {
          setNiches((prev) => (pageNum === 1 ? nicheList : [...prev, ...nicheList]));
          setPage(pageNum);
        }

        setHasMore(pageNum < response.pagination.total_pages);
      } catch (err) {
        show({
          variant: "error",
          title: "Error loading niches",
          message: "Failed to load your niches. Please try again.",
        });
        console.error("Error loading niches:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [show]
  );

  useEffect(() => {
    fetchNiches(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      fetchNiches(page + 1, false);
    }
  };

  const handleRefresh = () => {
    fetchNiches(1, true);
  };

  const renderNicheItem = useCallback(
    ({ item }: { item: Niches }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/myniches/[id]",
            params: { id: item.id, name: item.name },
          })
        }
        android_ripple={{ color: "#00000011" }}
      >
        <View className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-[#efe9e7]">
          <View className="flex-row">
            {/* Niche Icon/Image */}
            <View className="w-24 h-24 bg-[#f5f2f1] justify-center items-center">
              <Text className="text-3xl">
                {(item.name ?? "").charAt(0).toUpperCase() || "?"}
              </Text>
            </View>

            {/* Content */}
            <View className="flex-1 p-3 justify-space-between">
              <View>
                <Text className="font-semibold text-[#111418] text-base" numberOfLines={1}>
                  {item.name ?? "Unnamed"}
                </Text>
                <Text className="text-xs text-[#876d64] mt-1" numberOfLines={2}>
                  {item.description ?? ""}
                </Text>
              </View>

              {/* Stats */}
              <View className="flex-row gap-3 mt-2">
                <View>
                  <Text className="text-xs text-[#876d64]">Members</Text>
                  <Text className="font-semibold text-[#111418]">
                    {item.member_count}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-[#876d64]">Posts</Text>
                  <Text className="font-semibold text-[#111418]">
                    {item.post_count}
                  </Text>
                </View>
              </View>
            </View>

            {/* Arrow */}
            <View className="w-12 justify-center items-center">
              <ChevronRight size={20} color="#876d64" />
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#e26136" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-4 py-4 border-b border-[#efe9e7] flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-[#111418]">My Niches</Text>
          <Text className="text-sm text-[#876d64] mt-1">
            {niches.length} niche{niches.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {role === "seller" && (
          <TouchableOpacity
            onPress={() => nicheFormRef.current?.expand?.()}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-primary"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create community"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm">Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={niches}
        keyExtractor={(item) => item.id}
        renderItem={renderNicheItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={
          loading ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#e26136" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-16">
              <Text className="text-[#171311] font-semibold text-base">
                No niches yet
              </Text>
              <Text className="text-[#876d64] text-sm mt-1">
                Join or create a niche to get started.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      {role === "seller" && (
        <CreateNicheBottomSheet
          ref={nicheFormRef}
          onCreated={() => fetchNiches(1, true)}
        />
      )}
    </SafeAreaView>
  );
}
