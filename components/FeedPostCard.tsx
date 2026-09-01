/**
 * FeedPostCard — Renders a post in the hybrid feed.
 *
 * - Header: Avatar + username (→ profile), optional niche label
 * - Body: Caption (truncate with "more"), media (image/video, respect aspect_ratio)
 * - Footer: Likes, comments; tap card → post detail
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable, Share } from "react-native";
import { Link, useRouter } from "expo-router";
import { Heart, MessageCircle, Send } from "lucide-react-native";
import type { FeedPost } from "../types/feed";
import { likePost } from "../services/sections/post";
import { useToast } from "./ToastProvider";
import Avatar from "./Avatar";
import { PostMediaGrid, mediaTypeOf, type MediaItem } from "./postMedia";
import { useTheme } from "./themeProvider";
import { useGamificationLookup } from "../hooks/useGamificationLookup";
import TierBadge from "./gamification/TierBadge";

interface Props {
  post: FeedPost;
  onLike?: (postId: string) => Promise<void>;
}

function FeedPostCard({ post, onLike }: Props) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [likedByMe, setLikedByMe] = useState(post.liked_by_me ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { profile: authorGamification } = useGamificationLookup(post.user?.id);

  // A refresh re-serves the same post id with server-side counts. Without this
  // the card would keep showing the counts captured when it first mounted.
  useEffect(() => {
    setLikeCount(post.likes_count);
    setLikedByMe(post.liked_by_me ?? false);
  }, [post.id, post.likes_count, post.liked_by_me]);

  const mediaItems: MediaItem[] = useMemo(
    () =>
      (post.media ?? [])
        .filter((m) => !!m?.url)
        .map((m) => ({
          uri: m.url,
          type: mediaTypeOf(m),
        })),
    [post.media]
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this post on Markt`,
        url: `markt://post/${post.id}`,
        title: "Share post",
      });
    } catch {
      // User cancelled or share failed
    }
  }, [post.id]);

  // Comments live on the detail screen. This used to be a Pressable with no
  // onPress, which registers a touch responder and swallowed the tap instead
  // of letting the parent Link navigate — the button was dead.
  const handleOpenComments = useCallback(() => {
    router.push(`/postDetails/${post.id}`);
  }, [router, post.id]);

  const handleLike = useCallback(async () => {
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
  }, [isLiking, likedByMe, likeCount, onLike, post.id, show]);

  return (
    <Link href={`/postDetails/${post.id}`} asChild>
      <TouchableOpacity activeOpacity={0.85} className="px-4 pt-4">
        <View className={`rounded-card border p-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
          {/* Header: avatar, username, niche */}
          <View className="flex-row items-center mb-3">
            <Avatar
              uri={post.user?.profile_picture}
              name={post.user?.username}
              size={40}
              className="mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className={`font-semibold text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
                  numberOfLines={1}
                >
                  {post.user?.username ?? "Unknown"}
                </Text>
                {authorGamification && (
                  <TierBadge
                    tier={authorGamification.tier.key}
                    stars={authorGamification.tier.stars}
                    colorHex={authorGamification.tier.color_hex}
                    size="sm"
                  />
                )}
              </View>
              {post.niche && (
                <Text
                  className={`text-xs mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-text-secondary"}`}
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
              className={`mb-3 text-sm leading-5 ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
              numberOfLines={3}
            >
              {post.caption}
            </Text>
          ) : null}

          {/* Media — grid of up to 5 images/videos, tap opens fullscreen */}
          {mediaItems.length > 0 && (
            <View className="mb-3">
              <PostMediaGrid media={mediaItems} />
            </View>
          )}

          {/* Footer: engagement — even spacing like modern social apps */}
          <View className={`flex-row mt-3 pt-2 border-t gap-6 ${isDark ? "border-[#46464e]" : "border-border-light"}`}>
            <Pressable
              onPress={handleLike}
              disabled={isLiking}
              className="flex-row items-center gap-2 py-1 min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel={`${likeCount} likes. Double tap to like`}
            >
              <Heart size={18} color={likedByMe ? "#e26136" : "#876d64"} fill={likedByMe ? "#e26136" : "transparent"} />
              <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>{likeCount}</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenComments}
              className="flex-row items-center gap-2 py-1 min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel={`${post.comments_count} comments. Open post`}
            >
              <MessageCircle size={18} color="#876d64" />
              <Text className={`text-sm ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}>
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

// Feed rows re-render whenever the screen above them does (tab switch, shop
// strip collapse). Comparing on the fields the card actually reads keeps that
// to the rows whose data really changed.
export default React.memo(FeedPostCard, (prev, next) => {
  const a = prev.post;
  const b = next.post;
  return (
    a.id === b.id &&
    a.likes_count === b.likes_count &&
    a.comments_count === b.comments_count &&
    a.liked_by_me === b.liked_by_me &&
    a.caption === b.caption &&
    a.media === b.media &&
    prev.onLike === next.onLike
  );
});
