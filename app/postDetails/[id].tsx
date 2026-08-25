import React, { useEffect, useState, useCallback, useRef } from "react";
import {View,Text,ScrollView,FlatList,ActivityIndicator,TouchableOpacity,TextInput,Image, KeyboardAvoidingView, Share} from "react-native";
import {  ArrowLeft,  Heart,  MessageCircle,  Send,  Image as ImageIcon, X, SendHorizonal} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commentOnPost, getPostById, getPostComments, likePost } from "../../services/sections/post";
import { CommentItem, CommentResponse, PostDetails } from "../../models/post";
import { useToast } from "../../components/ToastProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseDate } from "../../utils/parseDate";
import { useUser } from "../../hooks/userContextProvider";
import { getUserProfile } from "../../services/sections/profile";
import Avatar from "../../components/Avatar";
import type { UserProfile } from "../../models/profile";
import { useTheme } from "../../components/themeProvider";
import { getProductById } from "../../services/sections/product";
import { addToCart } from "../../services/sections/cart";
import type { ProductDetail } from "../../models/products";
import { formatNaira } from "../../utils/formatCurrency";
import { resolveProductImageUri } from "../../utils/imageUri";
import logger from "../../utils/logger";
import { PostMediaGrid, mediaTypeOf, type MediaItem } from "../../components/postMedia";



// Helper component for comment rendering
const SingleCommentComponent = React.memo(({ comment, isDark }: { comment: CommentItem, isDark: boolean }) => {
  return (
    <View className="flex w-full flex-row items-start justify-start gap-3 p-4">
      <Avatar
        uri={comment.user?.profile_picture_url}
        name={comment.user?.username}
        size={40}
      />
      <View className="flex h-full flex-1 flex-col items-start justify-start">
        <View className="flex w-full flex-row items-start justify-start gap-x-3">
          <Text className={`text-sm font-bold leading-normal tracking-[0.015em] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {comment.user.username}
          </Text>
          <Text className={`text-sm font-normal leading-normal ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {parseDate(comment.created_at)}
          </Text>
        </View>
        <Text className={`text-sm font-normal leading-normal ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          {comment.content}
        </Text>
      </View>
    </View>
  );
});

// Main Screen Component
export default function PostDetailsScreen() {
  const [post, setPost] = useState<PostDetails | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [newComment, setNewComment] = useState<string>("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Control for infinite scroll
  const loadingCommentsRef = useRef(false);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sponsoredProduct, setSponsoredProduct] = useState<ProductDetail | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const FetchPost = async (id: string) => {
    try {
      const res = await getPostById(id);
      setPost(res);
      setLikeCount(res.like_count ?? 0);
      setLikedByMe(res.liked_by_me ?? false);
    } catch (error) {
      show({
        variant: "error",
        title: "Error loading post",
        message: "There was an issue retrieving the post details.",
      });
    }
  };

  const handleLike = async () => {
    if (isLiking || !post) return;
    setIsLiking(true);
    const prevLiked = likedByMe;
    const prevCount = likeCount;
    setLikedByMe(!likedByMe);
    setLikeCount((c) => (likedByMe ? Math.max(0, c - 1) : c + 1));
    try {
      await likePost(post.id);
    } catch {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
      show({ variant: "error", title: "Could not like", message: "Please try again." });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out this post on Markt",
        url: `markt://post/${post?.id}`,
        title: "Share post",
      });
    } catch {
      // User cancelled
    }
  };

  useEffect(() => {
    if (id) FetchPost(id);
  }, [id]);

  // Resolve the attached ("sponsored") product — the post only carries product_id(s).
  useEffect(() => {
    const productId = post?.products?.[0]?.product_id;
    if (!productId) {
      setSponsoredProduct(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const detail = await getProductById(productId);
        if (!cancelled) setSponsoredProduct(detail);
      } catch (err) {
        if (!cancelled) logger.error("Failed to load sponsored product:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.products]);

  const handleAddSponsoredToCart = async () => {
    if (!sponsoredProduct || addingToCart) return;
    setAddingToCart(true);
    try {
      await addToCart({ product_id: sponsoredProduct.id, variant_id: 0, quantity: 1 });
      show({
        variant: "success",
        title: "Added to cart",
        message: `${sponsoredProduct.name} has been added to your cart.`,
      });
    } catch {
      show({
        variant: "error",
        title: "Could not add to cart",
        message: "Please sign in as a buyer and try again.",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const createComment = async (comment: string, parentId?: number) => {
    try {
      if (comment == "") return;
      const newComment = await commentOnPost(id, comment, parentId);
      setComments((prev) => [newComment, ...prev]);
      setNewComment("");
    } catch (error) {
      show({
        variant: "error",
        title: "Error adding comment",
        message: "There was an issue adding your comment.",
      });
    }
  };

  const loadComments = useCallback(async () => {
    // Ref guard, not state — onEndReached can fire more than once before a
    // state update flushes, letting two calls fetch the same page and append
    // duplicate ids (causing the FlatList "same key" error).
    if (loadingCommentsRef.current || !hasMore) return;
    loadingCommentsRef.current = true;

    setLoading(true);
    try {
      const commentResponse = await getPostComments(id, page);
      const totalPages = commentResponse.pagination.total_pages;
      const newComments = commentResponse.items;

      setComments((prev) => {
        const merged = [...prev, ...newComments];
        const seen = new Set<number>();
        return merged.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
      });

      // Increment page
      const nextPage = page + 1;
      setPage(nextPage);

      // Check if we've reached the last page
      if (nextPage > totalPages) {
        setHasMore(false);
      }

      setLoading(false);
    } catch (error) {
      show({
        variant: "error",
        title: "Error loading comments",
        message: "There was an issue retrieving the post comments.",
      });
      setLoading(false);
    } finally {
      loadingCommentsRef.current = false;
    }
  }, [id, page, hasMore, show]);

  useEffect(() => {
    // Initial load of comments
    if (id && page === 1 && comments.length === 0) {
      loadComments();
    }
  }, [id, comments.length, loadComments]);

  const myAvatarUri = profile?.profile_picture_url || profile?.profile_picture || undefined;
  const myDisplayName = profile?.username || user?.email;

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        </View>
      </SafeAreaView>
    );
  }

  const postMedia: MediaItem[] = (post.social_media ?? [])
    .filter((sm) => !!sm?.media?.original_url)
    .map((sm) => ({
      uri: sm.media.original_url,
      type: mediaTypeOf({
        media_type: (sm.media as any)?.media_type,
        mime_type: (sm.media as any)?.mime_type,
        url: sm.media.original_url,
      }),
    }));

  // Header, post content, and sponsored ad are rendered in the ListHeaderComponent
  const renderListHeader = () => (
    <View>
      {/* Header Bar */}
      <View className={`flex items-center p-4 pb-2 flex-row ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <TouchableOpacity
          className="flex size-12 shrink-0 items-center justify-center"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
          Post
        </Text>
      </View>

      <View className={`flex flex-row gap-4 min-h-[72px] py-2 px-4 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
        <Avatar uri={post.user?.profile_picture_url} name={post.user?.username} size={56} />
        <View className="flex flex-col justify-center">
          <Text className={`text-base font-medium leading-normal line-clamp-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            {post.user.username}
          </Text>
          <Text className={`text-sm font-normal leading-normal line-clamp-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {parseDate(post.created_at)}
          </Text>
        </View>
      </View>

      {/* Caption */}
      <Text className={`text-base font-normal leading-normal pb-3 pt-1 px-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        {post.caption}
      </Text>

      {/* Media — Instagram-style grid (max 5), tap any tile for fullscreen */}
      {postMedia.length > 0 && (
        <View className={`flex w-full grow p-4 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <PostMediaGrid media={postMedia} />
        </View>
      )}


      {/* Attached product — resolved from the post's product_id */}
      {sponsoredProduct && (
        <TouchableOpacity
          className="p-4"
          activeOpacity={0.8}
          onPress={() => router.push(`/productDetails/${sponsoredProduct.id}`)}
        >
        <View className="flex items-stretch justify-between gap-4 rounded flex-row">
          <View className="flex flex-[2_2_0px] flex-col gap-4">
            <View className="flex flex-col gap-1">
              <Text className={`text-sm font-normal leading-normal ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                Featured product
              </Text>
              <Text
                numberOfLines={2}
                className={`text-base font-bold leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
              >
                {sponsoredProduct.name}
              </Text>
              <Text className={`text-sm font-normal leading-normal ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                {formatNaira(sponsoredProduct.price)}
              </Text>
            </View>
            <TouchableOpacity
              disabled={addingToCart}
              className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded h-8 px-4 flex-row-reverse w-fit ${addingToCart ? "opacity-60" : ""} ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              onPress={handleAddSponsoredToCart}
              accessibilityRole="button"
              accessibilityLabel={`Add ${sponsoredProduct.name} to cart`}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color={isDark ? "#f0f1f2" : "#000000"} />
              ) : (
                <Text className={`text-sm font-medium leading-normal truncate ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  Add to Cart
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {resolveProductImageUri(sponsoredProduct) ? (
            <Image
              source={{ uri: resolveProductImageUri(sponsoredProduct)! }}
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded flex-1"
            />
          ) : (
            <View className={`flex-1 aspect-video rounded ${isDark ? "bg-[#2f3132]" : "bg-surface"}`} />
          )}
        </View>
      </TouchableOpacity>
      )}

      {/* Social Actions — aligned with FeedPostCard: gap-6, min-h-[44px], orange heart when liked */}
      <View className={`flex-row mt-3 pt-2 border-t px-4 gap-6 ${isDark ? "border-[#46464e]" : "border-border"}`}>
        <TouchableOpacity
          onPress={handleLike}
          disabled={isLiking}
          className="flex-row items-center gap-2 py-1 min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel={`${likeCount} likes`}
        >
          <Heart
            size={18}
            color={likedByMe ? "#E94C2A" : (isDark ? "#c6c5cf" : "#71717A")}
            fill={likedByMe ? "#E94C2A" : "transparent"}
          />
          <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center gap-2 py-1 min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel={`${post.comment_count} comments`}
        >
          <MessageCircle size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
          <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{post.comment_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center gap-2 py-1 min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <Send size={18} color={isDark ? "#c6c5cf" : "#71717A"} />
          <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Header */}
      <Text className={`text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
        Comments
      </Text>
    </View>
  );

  const renderCommentItem = ({ item }: { item: CommentItem }) => (
    <SingleCommentComponent comment={item} isDark={isDark} />
  );

  const renderListFooter = () => {
    if (loading) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#71717A" />
        </View>
      );
    }
    return <View className="h-5" />; // Small spacer
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["top"]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
        <View className="relative flex-1 flex-col justify-between" style={{ backgroundColor: isDark ? "#1a1c1d" : "white" }}>
          <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCommentItem}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          onEndReached={loadComments}
          onEndReachedThreshold={0.5}
          // This is a common pattern to ensure the flatlist can scroll properly
          contentContainerStyle={{ flexGrow: 1 }}
        />

          <SafeAreaView edges={["bottom"]}>
            <View className={`px-4 py-3 border-t ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
              <View className="flex-row items-center gap-3">
                <Avatar uri={myAvatarUri} name={myDisplayName} size={40} />

              {/* Input + Icons */}
              <View className={`flex-1 flex-row items-center rounded px-3 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
                {/* Text Input */}
                <TextInput
                  placeholder="Add a comment..."
                  placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
                  className={`flex-1 text-base font-normal py-2 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />

                {/* Right-side Icons */}
                <View className="flex-row items-center">
                  {/* Send button */}
                  <TouchableOpacity
                    className="p-1.5"
                    onPress={() => createComment(newComment)}
                  >
                    <SendHorizonal size={20} color={isDark ? "#f0f1f2" : "#000000"} />
                  </TouchableOpacity>
                </View>
              </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
