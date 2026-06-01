import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, ChevronRight, Compass, ArrowLeft } from "lucide-react-native";
import { useToast } from "../components/ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import { getMyNiches } from "../services/sections/niches";
import { Niches } from "../models/niches";
import CreateNicheBottomSheet from "../components/nicheCreateBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../components/themeProvider";

export default function MyNichesScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nicheFormRef = useRef<BottomSheet | null>(null);
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
            pathname: "/niches/[id]",
            params: { id: item.id },
          })
        }
        android_ripple={{ color: isDark ? "#ffffff11" : "#00000011" }}
        className="px-6 mb-4"
      >
        <View className={`rounded overflow-hidden border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          <View className="flex-row">
            {/* Niche Icon/Image */}
            <View className={`w-24 h-24 justify-center items-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
              <Text className={`text-3xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                {(item.name ?? "").charAt(0).toUpperCase() || "?"}
              </Text>
            </View>

            {/* Content */}
            <View className="flex-1 p-4 justify-between">
              <View>
                <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                  {item.name ?? "Unnamed"}
                </Text>
                <Text className={`text-xs font-inter mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`} numberOfLines={2}>
                  {item.description ?? ""}
                </Text>
              </View>

              {/* Stats */}
              <View className="flex-row gap-4 mt-2">
                <View>
                  <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Members</Text>
                  <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                    {item.member_count}
                  </Text>
                </View>
                <View>
                  <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Posts</Text>
                  <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                    {item.post_count}
                  </Text>
                </View>
              </View>
            </View>

            {/* Arrow */}
            <View className="w-10 justify-center items-center pr-2">
              <ChevronRight size={18} color={isDark ? "#c6c5cf" : "#71717A"} strokeWidth={1.5} />
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [router, isDark]
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top"]}>
      <View className={`px-6 py-6 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`h-10 w-10 rounded border items-center justify-center mb-4 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
            </TouchableOpacity>
            <Text className={`text-2xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>My Niches</Text>
            <Text className={`text-sm font-inter mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {niches.length} niche{niches.length !== 1 ? "s" : ""} joined
            </Text>
          </View>
          {role === "seller" && (
            <TouchableOpacity
              onPress={() => nicheFormRef.current?.expand?.()}
              className="flex-row items-center gap-2 px-6 py-3 rounded bg-primary"
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Create community"
            >
              <Plus size={18} color="#fff" strokeWidth={2} />
              <Text className="text-white font-geist font-bold text-sm">Create</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={niches}
        keyExtractor={(item) => item.id}
        renderItem={renderNicheItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />
        }
        ListFooterComponent={
          loading ? (
            <View className="py-6">
              <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20 px-8">
              <View className={`w-24 h-24 rounded items-center justify-center mb-6 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                <Compass size={40} color={isDark ? "#c6c5cf" : "#71717A"} strokeWidth={1.5} />
              </View>
              <Text className={`font-geist font-bold text-xl text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                No niches yet
              </Text>
              <Text className={`font-inter text-base mt-2 text-center leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Join or create a community to connect with others.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/discoverNiches")}
                className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center"
              >
                <Text className="text-white font-geist font-bold text-base">Explore communities</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }}
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
