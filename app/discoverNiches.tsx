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

function NicheCard({
  niche,
  onPress,
  onJoin,
  joining,
}: {
  niche: Niches;
  onPress: () => void;
  onJoin: () => void;
  joining: boolean;
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
    <View className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-[#efe9e7] flex-row p-4">
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="flex-1 flex-row">
        <View className="w-14 h-14 rounded-xl bg-[#f5f2f1] justify-center items-center">
          <Text className="text-2xl">{(niche.name ?? "").charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <View className="flex-1 ml-4">
          <Text className="font-semibold text-[#111418] text-base" numberOfLines={1}>
            {niche.name ?? "Unnamed"}
          </Text>
          <Text className="text-xs text-[#876d64] mt-0.5" numberOfLines={2}>
            {niche.description ?? ""}
          </Text>
          <View className="flex-row gap-4 mt-2 flex-wrap">
            <Text className="text-xs text-[#876d64]">
              {niche.member_count ?? 0} members · {niche.post_count ?? 0} posts
            </Text>
            <View className="px-2 py-0.5 rounded bg-[#f5f2f1]">
              <Text className="text-xs text-[#876d64]">{visibilityLabel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onJoin}
        disabled={joining}
        className="self-center ml-3 px-4 py-2 rounded-full bg-primary min-h-[36px] justify-center"
        accessibilityRole="button"
        accessibilityLabel="Join community"
      >
        {joining ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white font-semibold text-sm">Join</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function DiscoverNichesScreen() {
  const router = useRouter();
  const { show } = useToast();
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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#171311" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-text-primary text-center pr-10">
          Discover Communities
        </Text>
      </View>

      <View className="px-4 py-3 flex-row items-center bg-bg-muted rounded-xl mx-4 mt-3">
        <Search size={20} color="#876d64" />
        <TextInput
          className="ml-3 flex-1 text-text-primary text-base"
          placeholder="Search communities..."
          placeholderTextColor="#876d64"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {categories.length > 0 && (
        <View className="border-b border-border pb-1 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className="py-2 px-3 min-h-[40px] justify-center rounded-full bg-bg-muted"
            >
              <Text
                className={`font-semibold text-sm ${selectedCategory === null ? "text-text-primary" : "text-text-secondary"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(c.id)}
                className="py-2 px-3 min-h-[40px] justify-center rounded-full bg-bg-muted"
              >
                <Text
                  className={`font-semibold text-sm ${selectedCategory === c.id ? "text-text-primary" : "text-text-secondary"}`}
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
          <ActivityIndicator size="large" color="#e26136" />
          <Text className="text-text-secondary text-sm mt-2">Loading communities…</Text>
        </View>
      ) : niches.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6 py-16">
          <Text className="text-text-primary font-semibold text-lg text-center">No communities found</Text>
          <Text className="text-text-secondary text-sm mt-2 text-center">
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
              onPress={() => router.push({ pathname: "/niches/[id]", params: { id: item.id } })}
              onJoin={() => handleJoin(item.id)}
              joining={joiningId === item.id}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#e26136" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
