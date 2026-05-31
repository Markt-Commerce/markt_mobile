/**
 * Discover Communities — Search and browse niche communities (NICHES_API §2.2)
 *
 * GET /socials/niches with search, optional category filter.
 * Cards: name, description, member_count, post_count, visibility badge.
 * Join → POST /socials/niches/<id>/join; tap → niche detail.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "lodash";
import { getNiches, joinNiche } from "../services/sections/niches";
import { getAllCategories } from "../services/sections/categories";
import type { Niches } from "../models/niches";
import type { Category } from "../models/categories";
import { useToast } from "../components/ToastProvider";
import { useTheme } from "../components/themeProvider";

function NicheCard({
  niche,
  onPress,
  onJoin,
  joining,
  isDark,
}: {
  niche: Niches;
  onPress: () => void;
  onJoin: () => void;
  joining: boolean;
  isDark: boolean;
}) {
  const visibilityLabel =
    niche.visibility === "public"
      ? "Public"
      : niche.visibility === "private"
        ? "Private"
        : niche.visibility === "restricted"
          ? "Restricted"
          : (niche.visibility as string) ?? "Public";

  return (
    <View className={`mx-4 mb-4 rounded overflow-hidden border flex-row p-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="flex-1 flex-row">
        <View className={`w-14 h-14 rounded justify-center items-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
          <Text className={`text-2xl font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{(niche.name ?? "").charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <View className="flex-1 ml-4">
          <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
            {niche.name ?? "Unnamed"}
          </Text>
          <Text className={`font-inter text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`} numberOfLines={2}>
            {niche.description ?? ""}
          </Text>
          <View className="flex-row gap-3 mt-3 flex-wrap items-center">
            <Text className={`font-inter text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {niche.member_count ?? 0} members · {niche.post_count ?? 0} posts
            </Text>
            <View className={`px-2 py-0.5 rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
              <Text className={`font-geist font-medium text-[10px] uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{visibilityLabel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onJoin}
        disabled={joining}
        className="self-center ml-3 px-5 py-2 rounded bg-primary min-h-[36px] justify-center"
        accessibilityRole="button"
        accessibilityLabel="Join community"
      >
        {joining ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white font-geist font-semibold text-sm">Join</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function DiscoverNichesScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [niches, setNiches] = useState<Niches[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchNiches = useCallback(
    async (p: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else if (p === 1) setLoading(true);
      try {
        const res = await getNiches({
          page: p,
          per_page: 20,
          search: search?.trim() || undefined,
          category_ids: selectedCategory ? [selectedCategory] : undefined,
          visibility: undefined,
        });
        const list = res.items ?? [];
        if (append) {
          setNiches((prev) => [...prev, ...list]);
        } else {
          setNiches(list);
        }
        const totalPages = res.pagination?.total_pages ?? 1;
        setHasNext(p < totalPages);
        setPage(p);
      } catch {
        if (!append) setNiches([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedCategory]
  );

  const debouncedFetch = useCallback(
    debounce((p: number) => fetchNiches(p, false), 350),
    [fetchNiches]
  );

  useEffect(() => {
    fetchNiches(1, false);
  }, [selectedCategory]);

  useEffect(() => {
    if (search !== undefined) debouncedFetch(1);
  }, [search]);

  useEffect(() => {
    getAllCategories()
      .then((cats) => setCategories(cats ?? []))
      .catch(() => {});
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasNext) fetchNiches(page + 1, true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNiches(1, false);
    setRefreshing(false);
  };

  const handleJoin = async (nicheId: string) => {
    setJoiningId(nicheId);
    try {
      await joinNiche(nicheId);
      show({ variant: "success", title: "Joined!", message: "You are now a member of this community." });
      await fetchNiches(1, false);
    } catch (e) {
      show({
        variant: "error",
        title: "Could not join",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top"]}>
      <View className={`flex-row items-center px-6 py-4 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-xl font-geist font-bold text-center pr-8 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Discover Communities
        </Text>
      </View>

      <View className={`px-4 py-3 flex-row items-center rounded mx-6 mt-4 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
        <Search size={20} color={isDark ? "#c6c5cf" : "#71717A"} />
        <TextInput
          className={`ml-3 flex-1 font-inter text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
          placeholder="Search communities..."
          placeholderTextColor={isDark ? "#c6c5cf" : "#71717A"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {categories.length > 0 && (
        <View className="pb-1 mb-2 mt-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 12 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className={`py-2 px-4 min-h-[40px] justify-center rounded ${selectedCategory === null ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
            >
              <Text
                className={`font-geist font-semibold text-sm ${selectedCategory === null ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(c.id)}
                className={`py-2 px-4 min-h-[40px] justify-center rounded ${selectedCategory === c.id ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              >
                <Text
                  className={`font-geist font-semibold text-sm ${selectedCategory === c.id ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center py-16">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
          <Text className={`text-sm mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading communities…</Text>
        </View>
      ) : niches.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className={`font-semibold text-lg text-center ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>No communities found</Text>
          <Text className={`text-sm mt-2 text-center ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Try a different search or filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={niches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NicheCard
              niche={item}
              onPress={() => router.push(`/niches/${item.id}`)}
              onJoin={() => handleJoin(item.id)}
              joining={joiningId === item.id}
              isDark={isDark}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#f0f1f2" : "#000000"} />}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
