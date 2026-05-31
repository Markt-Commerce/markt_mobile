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
import { useTheme } from "./themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
      <TouchableOpacity activeOpacity={0.9} className="mb-8 px-6">
        <View className={`rounded border overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          {/* Header: avatar, username, niche */}
          <View className="flex-row items-center p-5">
            <Avatar
              uri={post.user?.profile_picture}
              name={post.user?.username}
              size={48}
              className="mr-4"
            />
            <View className="flex-1">
              <Text
                className={`font-geist font-bold text-sm tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                numberOfLines={1}
              >
                {post.user?.username ?? "Unknown"}
              </Text>
              {post.niche && (
                <Text
                  className={`font-geist font-bold text-[10px] uppercase tracking-widest mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                  numberOfLines={1}
                >
                  {post.niche.name}
                </Text>
              )}
            </View>
            <TouchableOpacity className="h-8 w-8 items-center justify-center">
               <View className={`h-1 w-1 rounded mb-1 ${isDark ? "bg-[#46464e]" : "bg-surface-dim"}`} />
               <View className={`h-1 w-1 rounded mb-1 ${isDark ? "bg-[#46464e]" : "bg-surface-dim"}`} />
               <View className={`h-1 w-1 rounded ${isDark ? "bg-[#46464e]" : "bg-surface-dim"}`} />
            </TouchableOpacity>
          </View>

          {/* Body: caption */}
          {post.caption ? (
            <View className="px-5 pb-5">
              <Text
                className={`font-inter text-[15px] leading-6 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                numberOfLines={4}
              >
                {post.caption}
              </Text>
            </View>
          ) : null}

          {/* Media */}
          {mediaUrl && (
            <View
              className={`w-full ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              style={{ aspectRatio: 1, maxHeight: MEDIA_MAX_HEIGHT }}
            >
              <SkeletonImage
                source={{ uri: mediaUrl }}
                containerClassName="w-full h-full"
                resizeMode="cover"
                accessibilityLabel="Post media"
              />
            </View>
          )}

          {/* Footer: engagement */}
          <View className="flex-row items-center justify-between px-5 h-16">
            <View className="flex-row items-center gap-6">
              <TouchableOpacity
                onPress={handleLike}
                disabled={isLiking}
                className="flex-row items-center gap-2"
                accessibilityRole="button"
                accessibilityLabel={`${likeCount} likes`}
              >
                <Heart size={20} strokeWidth={1} color={likedByMe ? "#E94C2A" : (isDark ? "#c6c5cf" : "#71717A")} fill={likedByMe ? "#E94C2A" : "transparent"} />
                <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{likeCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-2"
                accessibilityRole="button"
                accessibilityLabel={`${post.comments_count} comments`}
              >
                <MessageCircle size={20} strokeWidth={1} color={isDark ? "#f0f1f2" : "#000000"} />
                <Text className={`font-geist font-bold text-xs ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {post.comments_count}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleShare}
              className="h-10 w-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Share post"
            >
              <Send size={20} strokeWidth={1} color={isDark ? "#f0f1f2" : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
