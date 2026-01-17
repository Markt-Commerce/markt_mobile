import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "../../components/ToastProvider";
import { getNichePosts } from "../../services/sections/niches";
import { Post } from "../../models/feed";
import { ChevronLeft } from "lucide-react-native";
import PostDisplayComponent from "../../components/PostDisplayComponent";
import { likePost } from "../../services/sections/post";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NicheDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { show } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (!id) return;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await getNichePosts(id, pageNum, 10);
        
        // Unwrap the post objects from the niche post wrapper
        const unwrappedPosts = response.items.map((item) => item.post);
        
        if (isRefresh) {
          setPosts(unwrappedPosts);
          setPage(1);
        } else {
          setPosts((prev) => [...prev, ...unwrappedPosts]);
          setPage(pageNum);
        }

        setHasMore(pageNum < response.pagination.total_pages);
      } catch (err) {
        show({
          variant: "error",
          title: "Error loading posts",
          message: "Failed to load niche posts. Please try again.",
        });
        console.error("Error loading posts:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, show]
  );

  useEffect(() => {
    fetchPosts(1, false);
  }, [id]);

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      fetchPosts(page + 1, false);
    }
  };

  const handleRefresh = () => {
    fetchPosts(1, true);
  };

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        await likePost(postId);
      } catch (err) {
        console.error("Error liking post:", err);
        throw err;
      }
    },
    []
  );

  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostDisplayComponent post={item} onLike={handleLike} />
    ),
    [handleLike]
  );

  const Header = useCallback(
    () => (
      <View className="px-4 py-4 border-b border-[#efe9e7] bg-white">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-full bg-[#f5f2f1]"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color="#111418" />
          </Pressable>
          <Text className="text-lg font-semibold text-[#111418] flex-1 ml-3">
            {name || "Niche"}
          </Text>
        </View>
        <Text className="text-xs text-[#876d64]">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </Text>
      </View>
    ),
    [name, posts.length, router]
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e26136" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={<Header />}
        ListFooterComponent={
          loading ? (
            <View className="py-5">
              <ActivityIndicator size="small" color="#e26136" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-16">
              <Text className="text-[#171311] font-semibold text-base">
                No posts yet
              </Text>
              <Text className="text-[#876d64] text-sm mt-1">
                Be the first to post in this niche!
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        className="bg-white"
      />
    </SafeAreaView>
  );
}
