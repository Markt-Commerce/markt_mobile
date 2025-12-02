import React, { useEffect, useState, useCallback } from "react";
import {View,Text,ScrollView,FlatList,ActivityIndicator,TouchableOpacity,TextInput,Image, KeyboardAvoidingView} from "react-native";
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
      const newComments = (await getPostComments(id, page)).items;
      if (newComments.length === 0 && page > 1) {
        // If we stop receiving new comments, stop loading more
        setHasMore(false);
      } else {
        setComments((prev) => [...prev, ...newComments]);
        setPage((prev) => prev + 1);
      }
      setLoading(false);
    } catch (error) {
      show({
        variant: "error",
        title: "Error loading comments",
        message: "There was an issue retrieving the post comments.",
      });
    }
  }, [id, page, loading, hasMore]);

  useEffect(() => {
    // Initial load of comments
    if (id && page === 1) {
      loadComments();
      setPage(2)
    }
  }, [id, loadComments, page]);

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
          <View className="w-full gap-1 overflow-hidden bg-white aspect-[2/3] rounded-lg flex md:gap-2">
            <Image
              source={{ uri: post.social_media[0].media.original_url }}
              className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1"
            />
          </View>
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
    <View
      className="relative flex size-full min-h-screen flex-col bg-white justify-between group/design-root overflow-x-hidden"
    >
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
      <SafeAreaView>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
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
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
