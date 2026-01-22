import React, { useEffect, useState, useCallback } from "react";
import {View,Text,ScrollView,FlatList,ActivityIndicator,TouchableOpacity,TextInput,Image, KeyboardAvoidingView, Dimensions} from "react-native";
import {  ArrowLeft,  Heart,  MessageCircle,  Send,  Image as ImageIcon, X, SendHorizonal} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commentOnPost, getPostById, getPostComments, likePost } from "../../services/sections/post";
import { CommentItem, CommentResponse, PostDetails } from "../../models/post";
import { useToast } from "../../components/ToastProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseDate } from "../../utils/parseDate";
import { useUser } from "../../hooks/userContextProvider";
import { defaultProfilePicture } from "../../models/defaults";



// Helper component for comment rendering
const SingleCommentComponent = React.memo(({ comment }: { comment: CommentItem }) => {
  /* we need to work on replies to comments in the backend. */
  /* const paddingLeft = comment.isreply ? "pl-[68px]" : "pl-4"; */
  return (
    <View
      className={`flex w-full flex-row items-start justify-start gap-3 p-4 `}
    >
      <Image
        source={{ uri: comment.user.profile_picture_url }}
        className="aspect-square bg-cover rounded-full w-10 shrink-0"
      />
      <View className="flex h-full flex-1 flex-col items-start justify-start">
        <View className="flex w-full flex-row items-start justify-start gap-x-3">
          <Text className="text-[#171311] text-sm font-bold leading-normal tracking-[0.015em]">
            {comment.user.username}
          </Text>
          <Text className="text-[#876d64] text-sm font-normal leading-normal">
            {parseDate(comment.created_at)}
          </Text>
        </View>
        <Text className="text-[#171311] text-sm font-normal leading-normal">
          {comment.content}
        </Text>
      </View>
    </View>
  );
});

// Main Screen Component
export default function PostDetailsScreen() {
  const [post, setPost] = useState<PostDetails | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Control for infinite scroll
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();
  const {user, role} = useUser();


  const FetchPost = async (id: string) => {
  try {
    const res = await getPostById(id);
    setPost(res);
  } catch (error) {
    show({
      variant: "error",
      title: "Error loading post",
      message: "There was an issue retrieving the post details.",
    });
  }
};

  useEffect(() => {
    FetchPost(id);
  }, [id]);

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
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const commentResponse = await getPostComments(id, page);
      const totalPages = commentResponse.pagination.total_pages;
      const newComments = commentResponse.items;

      // Add comments first
      setComments((prev) => [...prev, ...newComments]);

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
    }
  }, [id, page, loading, hasMore, show]);

  useEffect(() => {
    // Initial load of comments
    if (id && page === 1 && comments.length === 0) {
      loadComments();
    }
  }, [id, comments.length, loadComments]);

  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#171311" />
      </View>
    );
  }

  // Header, post content, and sponsored ad are rendered in the ListHeaderComponent
  const renderListHeader = () => (
    <View>
      {/* Header Bar */}
      <View className="flex items-center bg-white p-4 pb-2 flex-row">
        <TouchableOpacity
          className="text-[#171311] flex size-12 shrink-0 items-center justify-center"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#171311" />
        </TouchableOpacity>
        <Text className="text-[#171311] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Post
        </Text>
      </View>

      <View className="flex flex-row gap-4 bg-white px-4 min-h-[72px] py-2">
        <Image
          source={{ uri: post.user.profile_picture_url || "https://i.pravatar.cc/150?img=7" }}
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-fit"
        />
        <View className="flex flex-col justify-center">
          <Text className="text-[#171311] text-base font-medium leading-normal line-clamp-1">
            {post.user.username}
          </Text>
          <Text className="text-[#876d64] text-sm font-normal leading-normal line-clamp-2">
            {parseDate(post.created_at)}
          </Text>
        </View>
      </View>

      {/* Caption */}
      <Text className="text-[#171311] text-base font-normal leading-normal pb-3 pt-1 px-4">
        {post.caption}
      </Text>

      {/* Main Image */}
      {post.social_media.length > 0 && (
        <View className="flex w-full grow bg-white p-4">
          {post.social_media.length === 1 ? (
            // Single image
            <View className="w-full gap-1 overflow-hidden bg-white aspect-[2/3] rounded-lg flex md:gap-2">
              <Image
                source={{ uri: post.social_media[0].media.original_url }}
                className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1"
              />
            </View>
          ) : (
            // Multiple images - Carousel
            <View>
              <FlatList
                data={post.social_media}
                keyExtractor={(_, idx) => idx.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get("window").width);
                  setCurrentImageIndex(idx);
                }}
                renderItem={({ item }) => (
                  <View style={{ width: Dimensions.get("window").width - 32 }} className="gap-1 overflow-hidden bg-white aspect-[2/3] rounded-lg flex">
                    <Image
                      source={{ uri: item.media.original_url }}
                      className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1"
                    />
                    {/* Left arrow indicator */}
                    {currentImageIndex > 0 && (
                      <View className="absolute left-2 top-1/2 transform -translate-y-1/2">
                        <Text className="text-white text-2xl opacity-70 font-bold">‹</Text>
                      </View>
                    )}
                    {/* Right arrow indicator */}
                    {currentImageIndex < post.social_media.length - 1 && (
                      <View className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Text className="text-white text-2xl opacity-70 font-bold">›</Text>
                      </View>
                    )}
                  </View>
                )}
              />

              {/* Dots indicator */}
              <View className="flex-row justify-center gap-2 py-3">
                {post.social_media.map((_, idx) => (
                  <View
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? "bg-[#e26136] w-6" : "bg-[#e5dedc] w-2"
                    }`}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      

      {/* Sponsored Product: I will work on a way to get the product details later */}
      {post.products?.length > 0 && (
        <View className="p-4">
        <View className="flex items-stretch justify-between gap-4 rounded-lg flex-row">
          <View className="flex flex-[2_2_0px] flex-col gap-4">
            <View className="flex flex-col gap-1">
              <Text className="text-[#876d64] text-sm font-normal leading-normal">
                Sponsored
              </Text>
              <Text className="text-[#171311] text-base font-bold leading-tight">
                Le name of ze product
              </Text>
              <Text className="text-[#876d64] text-sm font-normal leading-normal">
                Le price of ze product
              </Text>
            </View>
            <TouchableOpacity
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 flex-row-reverse bg-[#f4f1f0] w-fit"
              onPress={() => console.log("Add to cart")}
            >
              <Text className="text-[#171311] text-sm font-medium leading-normal truncate">
                Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=7" }}
            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
          />
        </View>
      </View>
      )}

      {/* Social Actions */}
      <View className="flex flex-wrap gap-4 px-4 py-2 justify-between flex-row">
        <View className="flex items-center justify-center gap-2 px-3 py-2 flex-row">
          <TouchableOpacity onPress={() => likePost(post.id)}>{/* work on this later */}
            <Heart size={24} color="#876d64" />
          </TouchableOpacity>
          <Text className="text-[#876d64] text-[13px] font-bold leading-normal tracking-[0.015em]">
            {post.like_count}
          </Text>
        </View>
        <View className="flex items-center justify-center gap-2 px-3 py-2 flex-row">
          <TouchableOpacity onPress={() => console.log("View comments")}>
            <MessageCircle size={24} color="#876d64" />
          </TouchableOpacity>
          <Text className="text-[#876d64] text-[13px] font-bold leading-normal tracking-[0.015em]">
            {post.comment_count}
          </Text>
        </View>
        <View className="flex items-center justify-center gap-2 px-3 py-2 flex-row">
          <TouchableOpacity onPress={() => console.log("Share")}>
            <Send size={24} color="#876d64" />
          </TouchableOpacity>
          <Text className="text-[#876d64] text-[13px] font-bold leading-normal tracking-[0.015em]">
            12
          </Text>
        </View>
      </View>

      {/* Comments Header */}
      <Text className="text-[#171311] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
        Comments
      </Text>
    </View>
  );

  const renderCommentItem = ({ item }: { item: CommentItem }) => (
    <SingleCommentComponent comment={item} />
  );

  const renderListFooter = () => {
    if (loading) {
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#876d64" />
        </View>
      );
    }
    return <View className="h-5" />; // Small spacer
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
      <View className="relative flex-1 flex-col bg-white justify-between group/design-root overflow-x-hidden">
        {/* Scrollable Content (Header and Comments) */}
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

        {/* Comment Input Footer */}
        <SafeAreaView edges={["bottom"]}>
          <View className="bg-white px-4 py-3 border-t border-[#e6e2e0]">
            <View className="flex-row items-center gap-3">
              {/* User Avatar */}
              <Image
                source={{ uri: defaultProfilePicture }}
                className="w-10 h-10 rounded-full bg-[#f4f1f0]"
              />

              {/* Input + Icons */}
              <View className="flex-1 flex-row items-center bg-[#f4f1f0] rounded-lg px-3">
                {/* Text Input */}
                <TextInput
                  placeholder="Add a comment..."
                  placeholderTextColor="#876d64"
                  className="flex-1 text-[#171311] text-base font-normal py-2"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />

                {/* Right-side Icons */}
                <View className="flex-row items-center">
                  {/* Attach image */}
                  {/* <TouchableOpacity
                    className="p-1.5"
                    onPress={() => console.log("Attach image")}
                  >
                    <ImageIcon size={20} color="#876d64" />
                  </TouchableOpacity> */}

                  {/* Send button */}
                  <TouchableOpacity
                    className="p-1.5"
                    onPress={() => createComment(newComment)}
                  >
                    <SendHorizonal size={20} color="#171311" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
