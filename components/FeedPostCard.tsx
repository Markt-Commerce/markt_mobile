/**
 * FeedPostCard — Renders a post in the hybrid feed.
 *
 * - Header: Avatar + username (→ profile), optional niche label
 * - Body: Caption (truncate with "more"), media (image/video, respect aspect_ratio)
 * - Footer: Likes, comments; tap card → post detail
 */

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Pressable, Share, Dimensions } from "react-native";
import { Link } from "expo-router";
import { Heart, MessageCircle, Send } from "lucide-react-native";
import type { FeedPost } from "../types/feed";
import { likePost } from "../services/sections/post";
import { useToast } from "./ToastProvider";
import Avatar from "./Avatar";
import SkeletonImage from "./SkeletonImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 16;
const MEDIA_MAX_HEIGHT = 320;

interface Props {
  post: FeedPost;
  onLike?: (postId: string) => Promise<void>;
}

export default function FeedPostCard({ post, onLike }: Props) {
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [likedByMe, setLikedByMe] = useState(post.liked_by_me ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const { show } = useToast();

  const mediaUrl = post.media?.[0]?.url;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on Markt`,
        url: `markt://post/${post.id}`,
        title: "Share post",
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const prevLiked = likedByMe;
    const prevCount = likeCount;
    setLikedByMe(!likedByMe);
    setLikeCount((c) => (likedByMe ? Math.max(0, c - 1) : c + 1));
    try {
      if (onLike) {
        await onLike(post.id);
      } else {
        await likePost(post.id);
      }
    } catch {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
      show({
        variant: "error",
        title: "Could not like",
        message: "Please try again.",
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link href={`/postDetails/${post.id}`} asChild>
      <TouchableOpacity activeOpacity={0.85} className="px-4 pt-4">
        <View className="rounded-card border border-border bg-white p-4">
          {/* Header: avatar, username, niche */}
          <View className="flex-row items-center mb-3">
            <Avatar
              uri={post.user?.profile_picture}
              name={post.user?.username}
              size={40}
              className="mr-3"
            />
            <View className="flex-1">
              <Text
                className="font-semibold text-text-primary text-sm"
                numberOfLines={1}
              >
                {post.user?.username ?? "Unknown"}
              </Text>
              {post.niche && (
                <Text
                  className="text-xs text-text-secondary mt-0.5"
                  numberOfLines={1}
                >
                  {post.niche.name}
                </Text>
              )}
            </View>
          </View>

          {/* Body: caption */}
          {post.caption ? (
            <Text
              className="mb-3 text-text-primary text-sm leading-5"
              numberOfLines={3}
            >
              {post.caption}
            </Text>
          ) : null}

          {/* Media */}
          {mediaUrl && (
            <View
              className="mb-3 overflow-hidden rounded-xl w-full"
              style={{ aspectRatio: 1, maxHeight: MEDIA_MAX_HEIGHT }}
            >
              <SkeletonImage
                source={{ uri: mediaUrl }}
                containerClassName="w-full h-full rounded-xl"
                resizeMode="cover"
                accessibilityLabel="Post media"
              />
            </View>
          )}

          {/* Footer: engagement — even spacing like modern social apps */}
          <View className="flex-row mt-3 pt-2 border-t border-border-light gap-6">
            <Pressable
              onPress={handleLike}
              disabled={isLiking}
              className="flex-row items-center gap-2 py-1 min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel={`${likeCount} likes. Double tap to like`}
            >
              <Heart size={18} color={likedByMe ? "#e26136" : "#876d64"} fill={likedByMe ? "#e26136" : "transparent"} />
              <Text className="text-text-primary text-sm">{likeCount}</Text>
            </Pressable>

            <Pressable
              className="flex-row items-center gap-2 py-1 min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel={`${post.comments_count} comments. Open post`}
            >
              <MessageCircle size={18} color="#876d64" />
              <Text className="text-text-primary text-sm">
                {post.comments_count}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="flex-row items-center gap-2 py-1 min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel="Share post"
            >
              <Send size={18} color="#876d64" />
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
