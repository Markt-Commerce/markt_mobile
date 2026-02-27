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
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { likePost } from "../../services/sections/post";

export default function NicheDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();

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

  const postFormRef = useRef<BottomSheetMethods | null>(null);

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
    if (id && page > 1) {
      loadNichePosts();
    }
  }, [page]);

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
      setPosts((prev) => (page === 1 ? res.items || [] : [...prev, ...(res.items || [])]));
      
      // Update pagination info from response
      setTotalPages(res.pagination.total_pages);
      setHasMore(page < res.pagination.total_pages);
      setHasError(false);
      
      if (res.items && res.items.length > 0) {
        setNiche(res.items[0]?.niche);
      }
    } catch (err) {
      console.error("Failed to load niche posts:", err);
      show({ variant: "error", title: "Error", message: "Could not load posts." });
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

  const renderPost = ({ item }: { item: NichePost }) => (
    <PostDisplayComponent post={item.post} onLike={(postId) => likePost(postId)} />
  );

  const handleEndReached = () => {
    if (!loading && hasMore && !hasError) {
      setPage((p) => p + 1);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setPage(1);
    setPosts([]);
    setHasMore(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#efe9e7]">
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={20} color="#e26136" />
              <Text className="text-[#e26136] font-semibold">Back</Text>
            </TouchableOpacity>
            <Text className="text-[#171311] text-lg font-extrabold mt-1">{niche?.name || "Niche"}</Text>
            <Text className="text-[#876d64] text-xs mt-1">{niche?.member_count || 0} members • {niche?.post_count || 0} posts</Text>
          </View>

          {isJoined && !isBanned && canPost && (
            <TouchableOpacity
              onPress={() => postFormRef.current?.expand?.()}
              className="p-2 rounded-full bg-[#e26136]"
              accessibilityRole="button"
              accessibilityLabel="Create post"
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Niche Info */}
        {niche && (
          <View className="px-4 py-4 border-b border-[#efe9e7]">
            <Text className="text-[#171311] text-sm mb-2">{niche.description}</Text>
            <Text className="text-[#876d64] text-xs">
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
          <View className="mx-4 mt-3 p-3 bg-[#fff5f3] border border-[#ffd9d2] rounded-lg">
            <Text className="text-[#b51f08] text-sm font-semibold">You have been banned from this niche</Text>
            <Text className="text-[#b51f08] text-xs mt-1">You cannot post in this community.</Text>
          </View>
        )}

        {/* Join/Leave Button */}
        {!isBanned && (
          <View className="px-4 py-3 border-b border-[#efe9e7]">
            <TouchableOpacity
              onPress={isJoined ? handleLeave : handleJoin}
              className={`py-3 rounded-full items-center justify-center ${
                isJoined ? "bg-[#f4f1f0]" : "bg-[#e26136]"
              }`}
            >
              <Text className={`font-semibold text-sm ${isJoined ? "text-[#171311]" : "text-white"}`}>
                {isJoined ? "Leave Niche" : "Join Niche"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error state with retry */}
        {hasError && (
          <View className="mx-4 mt-4 p-3 bg-[#fff5f3] border border-[#ffd9d2] rounded-lg items-center">
            <Text className="text-[#b51f08] text-sm font-semibold">Failed to load posts</Text>
            <TouchableOpacity onPress={handleRetry} className="mt-2 px-4 py-2 bg-[#e26136] rounded-lg">
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
            !loading ? (
              <View className="items-center justify-center py-16">
                <Text className="text-[#876d64] text-sm">No posts yet</Text>
                {isJoined && !isBanned && <Text className="text-[#876d64] text-xs mt-2">Be the first to post!</Text>}
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? <ActivityIndicator size="large" color="#e26136" style={{ marginVertical: 20 }} /> : null
          }
        />
      </View>

      {/* Post create bottom sheet (only for joined members who are not banned) */}
      {isJoined && !isBanned && canPost && <PostFormBottomSheet ref={postFormRef} nicheId={id} />}
    </SafeAreaView>
  );
}

