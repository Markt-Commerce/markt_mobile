import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, Compass, ArrowLeft } from "lucide-react-native";
import { useToast } from "../components/ToastProvider";
import { useUser } from "../hooks/userContextProvider";
import { getMyNiches } from "../services/sections/niches";
import { Niches } from "../models/niches";
import CreateNicheBottomSheet from "../components/nicheCreateBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../components/themeProvider";
import logger from "../utils/logger";
import { useFeed } from "../hooks/useFeed";
import type { FeedItem } from "../types/feed";
import { isFeedPost } from "../types/feed";
import FeedPostCard from "../components/FeedPostCard";

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
  const {
    items,
    initialLoading: feedLoading,
    refreshing: feedRefreshing,
    loadingMore,
    refresh: refreshFeed,
    loadMore,
  } = useFeed("joined_niches");

  const fetchNiches = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await getMyNiches(1, 50);
        setNiches(response.items.map((m) => m.niche));
      } catch (err) {
        show({
          variant: "error",
          title: "Error loading niches",
          message: "Failed to load your niches. Please try again.",
        });
        logger.error("Error loading niches:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [show]
  );

  useEffect(() => {
    fetchNiches(false);
  }, []);

  const handleRefresh = () => {
    fetchNiches(true);
    refreshFeed();
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
        className="mr-3"
      >
        <View className={`w-44 rounded-xl overflow-hidden border ${isDark ? "bg-surface-raised border-border-strong" : "bg-white border-[#e8e4e2]"}`}>
          <View>
            {/* Niche Icon/Image */}
            <View className={`h-20 justify-center items-center ${isDark ? "bg-surface-sunken" : "bg-[#f5f3f2]"}`}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className={`text-3xl font-bold text-text-primary`}>
                  {(item.name ?? "").charAt(0).toUpperCase() || "?"}
                </Text>
              )}
            </View>

            {/* Content */}
            <View className="p-3">
              <View>
                <Text className={`font-bold text-base text-text-primary`} numberOfLines={1}>
                  {item.name ?? "Unnamed"}
                </Text>
                <Text className={`text-[11px] mt-1 text-text-secondary`} numberOfLines={1}>
                  {item.member_count} members · {item.post_count} posts
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [router, isDark]
  );

  if (loading && feedLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-page" edges={["top"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top"]}>
      <View className={`px-6 pt-6 pb-5 border-b border-border-strong`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`h-10 w-10 rounded border items-center justify-center mb-4 ${isDark ? "bg-surface-sunken border-border-strong" : "bg-surface border-border"}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
            </TouchableOpacity>
            <Text className={`text-2xl font-bold text-text-primary`}>My Niches</Text>
            <Text className={`text-sm mt-1 text-text-secondary`}>
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
              <Text className="text-white font-bold text-sm">Create</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: FeedItem }) =>
          isFeedPost(item) ? <FeedPostCard post={item} /> : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing || feedRefreshing} onRefresh={handleRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6">
              <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !feedLoading ? (
            <View className="items-center justify-center py-20 px-8">
              <View className="mb-5">
                <Compass size={44} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={1.5} />
              </View>
              <Text className={`font-bold text-xl text-center text-text-primary`}>
                {niches.length === 0 ? "No niches yet" : "No posts yet"}
              </Text>
              <Text className={`text-base mt-2 text-center leading-6 text-text-secondary`}>
                {niches.length === 0
                  ? "Join or create a community to connect with others."
                  : "Posts from your communities will appear here."}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/discoverNiches")}
                className="mt-8 h-12 px-8 rounded bg-primary items-center justify-center"
              >
                <Text className="text-white font-bold text-base">Explore communities</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View className="py-5 pl-6">
            <Text className={`font-bold text-lg mb-3 text-text-primary`}>
              Your communities
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {niches.map((niche) => (
                <View key={niche.id}>{renderNicheItem({ item: niche })}</View>
              ))}
              <TouchableOpacity
                onPress={() => router.push("/discoverNiches")}
                className={`w-28 h-20 rounded-xl border items-center justify-center mr-6 ${isDark ? "border-border-strong" : "border-[#e8e4e2]"}`}
              >
                <Compass size={20} color={isDark ? "#c6c5cf" : "#71717A"} />
                <Text className={`text-xs font-semibold mt-1 text-text-secondary`}>Explore</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      {role === "seller" && (
        <CreateNicheBottomSheet
          ref={nicheFormRef}
          onCreated={() => fetchNiches(true)}
        />
      )}
    </SafeAreaView>
  );
}
