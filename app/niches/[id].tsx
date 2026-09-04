import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus, Users } from "lucide-react-native";
import { getNichePosts, joinNiche, leaveNiche, getMyNiches, getNicheById, canPostInNiche } from "../../services/sections/niches";
import { NichePost, Niches } from "../../models/niches";
import { useToast } from "../../components/ToastProvider";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { likePost } from "../../services/sections/post";
import { useTheme } from "../../components/themeProvider";
import logger from "../../utils/logger";

function dedupeById<T extends { id: string | number }>(items: T[]): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function NicheDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [posts, setPosts] = useState<NichePost[]>([]);
  const [niche, setNiche] = useState<Niches | null>(null);
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);

  const postFormRef = useRef<BottomSheet | null>(null);
  // Ref guard, not state — onEndReached can fire more than once before a state
  // update flushes, letting two calls fetch the same page and append duplicate
  // ids (causing the FlatList "same key" error).
  const fetchingPostsRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadNicheDetail();
      checkMembershipStatus();
    }
  }, [id]);

  useEffect(() => {
    if (id && isJoined && !isBanned) {
      checkCanPost();
    } else {
      setCanPost(false);
    }
  }, [id, isJoined, isBanned]);

  const loadNicheDetail = async () => {
    if (!id) return;
    try {
      const n = await getNicheById(id);
      setNiche(n);
    } catch {
      // fallback: will infer from first post in loadNichePosts
    }
  };

  const checkCanPost = async () => {
    if (!id) return;
    try {
      const res = await canPostInNiche(id);
      setCanPost(res.can_post ?? false);
    } catch {
      setCanPost(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setPage(1);
    setPosts([]);
    setHasMore(true);
    setHasError(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadNichePosts();
    }
  }, [id, page, postsRefreshKey]);

  const checkMembershipStatus = async () => {
    if (!id) return;
    try {
      const res = await getMyNiches(1, 100);
      const userNiche = res.items.find((m) => m.niche_id === id);
      
      if (userNiche) {
        setIsJoined(true);
        
        // Check if user is banned (assuming banned status is indicated by a property)
        // You may need to adjust this based on actual API response structure
        const isBannedStatus = !!(userNiche as any)?.is_banned || !!(userNiche as any)?.banned;
        setIsBanned(isBannedStatus);
        
        if (isBannedStatus) {
          show({
            variant: "error",
            title: "Banned",
            message: "You have been banned from this niche.",
          });
        }
      } else {
        setIsJoined(false);
        setIsBanned(false);
      }
    } catch (err) {
      show({ variant: "error", title: "Error", message: "Could not verify membership status." });

      // If check fails, assume not joined
      setIsJoined(false);
      setIsBanned(false);
    }
  };

  const loadNichePosts = async () => {
    if (!id || fetchingPostsRef.current || !hasMore || hasError) return;
    fetchingPostsRef.current = true;
    setLoading(true);
    try {
      const res = await getNichePosts(id, page, 10);
      const items = res.items ?? [];
      setPosts((prev) => dedupeById(page === 1 ? items : [...prev, ...items]));

      const totalPages = res.pagination?.total_pages ?? 1;
      setTotalPages(totalPages);
      setHasMore(page < totalPages);
      setHasError(false);

      if (items.length > 0 && items[0]?.niche) {
        setNiche((prev) => prev ?? items[0].niche);
      }
    } catch (err) {
      logger.error("Failed to load niche posts:", err);
      if (page === 1) {
        show({ variant: "error", title: "Error", message: "Could not load posts." });
      }
      setHasError(true);
    } finally {
      setLoading(false);
      fetchingPostsRef.current = false;
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    try {
      await joinNiche(id);
      setIsJoined(true);
      setIsBanned(false);
      setHasError(false);
      setPage(1);
      setPosts([]);
      setHasMore(true);
      setPostsRefreshKey((k) => k + 1);
      show({ variant: "success", title: "Joined", message: "You joined this niche!" });
    } catch (err) {
      show({ variant: "error", title: "Error", message: "Could not join niche." });
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    try {
      await leaveNiche(id);
      setIsJoined(false);
      setIsBanned(false);
      show({ variant: "success", title: "Left", message: "You left this niche." });
    } catch (err) {
      show({ variant: "error", title: "Error", message: "Could not leave niche." });
    }
  };

  const renderPost = ({ item }: { item: NichePost }) => {
    const post = item.post;
    if (!post?.id) return null;
    return <PostDisplayComponent post={post} onLike={(postId) => likePost(postId)} />;
  };

  const handleEndReached = () => {
    if (!loading && hasMore && !hasError) {
      setPage((p) => p + 1);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setPosts([]);
    setHasMore(true);
    if (page === 1) {
      loadNichePosts();
    } else {
      setPage(1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
      <View className="flex-1">
        {/* Banner, avatar, name, members, then the action — the X Communities
            shape. It was a back link stacked above the title with the
            description and the Join button in two more bordered strips below,
            so the community had no presence at all. */}
        <View>
          <View className={`h-32 ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}>
            {niche?.banner_url ? (
              <Image
                source={{ uri: niche.banner_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : null}
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="absolute left-4 top-3 w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="px-4 pt-3 pb-4">
            <View className="flex-row items-end" style={{ marginTop: -34 }}>
              <View
                className={`rounded-2xl p-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}
              >
                {niche?.image_url ? (
                  <Image
                    source={{ uri: niche.image_url }}
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                  />
                ) : (
                  <View
                    style={{ width: 64, height: 64, borderRadius: 16 }}
                    className={`items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}
                  >
                    <Text className={`text-[22px] font-bold ${isDark ? "text-[#c6c5cf]" : "text-[#52525B]"}`}>
                      {(niche?.name ?? "?").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {isJoined && !isBanned && canPost && (
                <TouchableOpacity
                  onPress={() => postFormRef.current?.expand?.()}
                  className="ml-auto mb-1 w-10 h-10 rounded-full bg-primary items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Create a post in this community"
                >
                  <Plus size={20} color="#fff" strokeWidth={2.4} />
                </TouchableOpacity>
              )}
            </View>

            <Text
              className={`text-[22px] font-bold mt-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
              numberOfLines={2}
            >
              {niche?.name || "Community"}
            </Text>
            <View className="flex-row items-center mt-1">
              <Users size={13} color={isDark ? "#8f9195" : "#A1A1AA"} strokeWidth={2} />
              <Text className={`text-[13px] ml-1.5 ${isDark ? "text-[#8f9195]" : "text-tertiary"}`}>
                {niche?.member_count ?? 0} members · {niche?.post_count ?? 0} posts
              </Text>
            </View>

            {niche?.description ? (
              <Text
                className={`text-[14px] leading-[20px] mt-2.5 ${isDark ? "text-[#c6c5cf]" : "text-[#3F3F46]"}`}
              >
                {niche.description}
              </Text>
            ) : null}

            {niche ? (
              <Text className={`text-[12px] mt-2 ${isDark ? "text-[#8f9195]" : "text-tertiary"}`}>
                {niche.allow_buyer_posts && niche.allow_seller_posts
                  ? "Buyers and sellers can post"
                  : niche.allow_buyer_posts
                    ? "Buyers can post"
                    : "Sellers can post"}
              </Text>
            ) : null}

            {!isBanned && (
              <TouchableOpacity
                onPress={isJoined ? handleLeave : handleJoin}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isJoined ? "Leave this community" : "Join this community"}
                className={`h-11 rounded-xl items-center justify-center mt-4 ${
                  isJoined
                    ? isDark
                      ? "bg-[#2f3132]"
                      : "bg-[#F4F4F5]"
                    : "bg-primary"
                }`}
              >
                <Text
                  className={`font-bold text-[15px] ${
                    isJoined ? (isDark ? "text-[#c6c5cf]" : "text-[#52525B]") : "text-white"
                  }`}
                >
                  {isJoined ? "Joined" : "Join community"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Banned Message */}
        {isBanned && (
          <View className={`mx-4 mb-3 p-3 rounded-xl ${isDark ? "bg-[#3A1E1E]" : "bg-[#FDECEC]"}`}>
            <Text className="text-[#C42B2B] text-[14px] font-semibold">
              You've been removed from this community
            </Text>
            <Text className="text-[#C42B2B] text-[13px] mt-0.5">
              You can still read it, but you can't post.
            </Text>
          </View>
        )}

        {/* Error state with retry */}
        {hasError && (
          <View className={`mx-4 mt-4 p-3 border rounded items-center ${isDark ? "bg-[#ba1a1a]/10 border-[#ba1a1a]" : "bg-error-bg border-error"}`}>
            <Text className="text-error text-sm font-semibold">Failed to load posts</Text>
            <TouchableOpacity onPress={handleRetry} className="mt-2 px-4 py-2 bg-primary rounded">
              <Text className="text-white text-sm font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posts List */}
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPost}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading && posts.length === 0 ? (
              <View className="items-center justify-center py-16">
                <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
                <Text className={`text-sm mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading posts…</Text>
              </View>
            ) : !loading && !hasError ? (
              <View className="items-center justify-center py-16">
                <Text className={`text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>No posts yet</Text>
                {isJoined && !isBanned && (
                  <Text className={`text-xs mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Be the first to post!</Text>
                )}
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} style={{ marginVertical: 20 }} /> : null
          }
        />
      </View>

      {/* Post create bottom sheet (only for joined members who are not banned) */}
      {isJoined && !isBanned && canPost && <PostFormBottomSheet ref={postFormRef} nicheId={id} />}
    </SafeAreaView>
  );
}
