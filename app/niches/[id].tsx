import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import { getNichePosts, joinNiche, leaveNiche, getMyNiches, getNicheById, canPostInNiche } from "../../services/sections/niches";
import { NichePost, Niches } from "../../models/niches";
import { useToast } from "../../components/ToastProvider";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import PostFormBottomSheet from "../../components/postCreateBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { likePost } from "../../services/sections/post";
import { useTheme } from "../../components/themeProvider";

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
      show({ variant: "error", title: "Error", message: "Could not verify membership status." + err});

      // If check fails, assume not joined
      setIsJoined(false);
      setIsBanned(false);
    }
  };

  const loadNichePosts = async () => {
    if (!id || loading || !hasMore || hasError) return;
    setLoading(true);
    try {
      const res = await getNichePosts(id, page, 10);
      const items = res.items ?? [];
      setPosts((prev) => (page === 1 ? items : [...prev, ...items]));

      const totalPages = res.pagination?.total_pages ?? 1;
      setTotalPages(totalPages);
      setHasMore(page < totalPages);
      setHasError(false);

      if (items.length > 0 && items[0]?.niche) {
        setNiche((prev) => prev ?? items[0].niche);
      }
    } catch (err) {
      console.error("Failed to load niche posts:", err);
      if (page === 1) {
        show({ variant: "error", title: "Error", message: "Could not load posts." });
      }
      setHasError(true);
    } finally {
      setLoading(false);
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
        <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <ArrowLeft size={20} color={isDark ? "#f0f1f2" : "#000000"} />
              <Text className={`font-semibold ml-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Back</Text>
            </TouchableOpacity>
            <Text className={`text-lg font-geist font-bold mt-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{niche?.name || "Niche"}</Text>
            <Text className={`text-xs mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{niche?.member_count || 0} members • {niche?.post_count || 0} posts</Text>
          </View>

          {isJoined && !isBanned && canPost && (
            <TouchableOpacity
              onPress={() => postFormRef.current?.expand?.()}
              className="p-2 rounded bg-primary"
              accessibilityRole="button"
              accessibilityLabel="Create post"
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Niche Info */}
        {niche && (
          <View className={`px-4 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
            <Text className={`text-sm mb-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{niche.description}</Text>
            <Text className={`text-xs ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              {niche.allow_buyer_posts && niche.allow_seller_posts
                ? "Buyers & Sellers can post"
                : niche.allow_buyer_posts
                ? "Buyers can post"
                : "Sellers can post"}
            </Text>
          </View>
        )}

        {/* Banned Message */}
        {isBanned && (
          <View className={`mx-4 mt-3 p-3 border rounded ${isDark ? "bg-[#ba1a1a]/10 border-[#ba1a1a]" : "bg-error-bg border-error"}`}>
            <Text className="text-error text-sm font-semibold">You have been banned from this niche</Text>
            <Text className="text-error text-xs mt-1">You cannot post in this community.</Text>
          </View>
        )}

        {/* Join/Leave Button */}
        {!isBanned && (
          <View className={`px-4 py-3 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
            <TouchableOpacity
              onPress={isJoined ? handleLeave : handleJoin}
              className={`py-3 rounded items-center justify-center ${
                isJoined ? (isDark ? "bg-[#2f3132]" : "bg-surface") : "bg-primary"
              }`}
            >
              <Text className={`font-semibold text-sm ${isJoined ? (isDark ? "text-[#f0f1f2]" : "text-black") : "text-white"}`}>
                {isJoined ? "Leave Niche" : "Join Niche"}
              </Text>
            </TouchableOpacity>
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
