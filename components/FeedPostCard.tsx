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
import { MoreHorizontal } from "lucide-react-native";
import type { FeedPost } from "../types/feed";
import { likePost } from "../services/sections/post";
import { useToast } from "./ToastProvider";
import Avatar from "./Avatar";
import { PostMediaGrid, mediaTypeOf, type MediaItem } from "./postMedia";
import { useTheme } from "./themeProvider";
import { useGamificationLookup } from "../hooks/useGamificationLookup";
import TierBadge from "./gamification/TierBadge";
import PostActionBar from "./PostActionBar";

interface Props {
  post: FeedPost;
  onLike?: (postId: string) => Promise<void>;
  /** Opens the save / share / report / block sheet. Omit to hide the "…". */
  onOpenActions?: (post: FeedPost) => void;
  saved?: boolean;
  onToggleSaved?: (post: FeedPost) => Promise<void> | void;
}

function compactAge(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

function FeedPostCard({ post, onLike, onOpenActions, saved, onToggleSaved }: Props) {
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

  const handleOpenActions = useCallback(() => {
    onOpenActions?.(post);
  }, [onOpenActions, post]);

  const handleOpenAuthor = useCallback(() => {
    if (!post.user?.id) return;
    router.push(`/profile/${post.user.id}`);
  }, [router, post.user?.id]);

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
      <TouchableOpacity activeOpacity={0.9}>
        <View className={`flex-row px-4 py-3 border-b ${isDark ? "bg-[#1a1c1d] border-[#34363a]" : "bg-white border-border"}`}>
          <Pressable
            onPress={handleOpenAuthor}
            disabled={!post.user?.id}
            className="mr-3 self-start"
            accessibilityRole="link"
            accessibilityLabel={`View ${post.user?.username ?? "author"}'s profile`}
          >
            <Avatar
              uri={post.user?.profile_picture}
              name={post.user?.username}
              size={42}
            />
          </Pressable>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center min-h-[22px]">
              <Pressable
                onPress={handleOpenAuthor}
                disabled={!post.user?.id}
                className="flex-row items-center flex-shrink gap-1.5"
                accessibilityRole="link"
                accessibilityLabel={`View ${post.user?.username ?? "author"}'s profile`}
              >
                <Text
                  className={`font-bold text-[15px] flex-shrink ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
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
              </Pressable>
              <Text
                className={`text-[13px] flex-shrink ${isDark ? "text-[#aeb0b7]" : "text-text-secondary"}`}
                numberOfLines={1}
              >
                {post.niche ? ` · ${post.niche.name}` : ""}{` · ${compactAge(post.created_at)}`}
              </Text>
            {onOpenActions ? (
              <Pressable
                onPress={handleOpenActions}
                hitSlop={10}
                className="ml-auto w-8 h-8 -mr-1 -my-1 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="More options for this post"
              >
                <MoreHorizontal size={20} color={isDark ? "#c6c5cf" : "#876d64"} />
              </Pressable>
            ) : null}
            </View>

          {post.caption ? (
            <Text
              className={`mb-2 text-[15px] leading-[21px] ${isDark ? "text-[#f0f1f2]" : "text-text-primary"}`}
              numberOfLines={6}
            >
              {post.caption}
            </Text>
          ) : null}

          {/* Media — grid of up to 5 images/videos, tap opens fullscreen */}
          {mediaItems.length > 0 && (
            // mt-2 only when there's no caption: the caption's own mb-2 is what
            // separated the header from the media, so an image-only post had
            // its first image jammed against the author's name.
            <View
              className={`mb-1 overflow-hidden ${post.caption ? "" : "mt-2"}`}
              style={{ borderRadius: 12 }}
            >
              <PostMediaGrid media={mediaItems} />
            </View>
          )}

          <PostActionBar
            likeCount={likeCount}
            commentCount={post.comments_count}
            views={post.views_count ?? post.view_count ?? post.views}
            liked={likedByMe}
            saved={saved ?? post.is_saved ?? false}
            disabled={isLiking}
            isDark={isDark}
            onLike={handleLike}
            onComment={handleOpenComments}
            onSave={() => onToggleSaved?.(post)}
            onShare={handleShare}
          />
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
    a.views_count === b.views_count &&
    a.view_count === b.view_count &&
    a.views === b.views &&
    a.is_saved === b.is_saved &&
    a.caption === b.caption &&
    a.created_at === b.created_at &&
    a.user?.username === b.user?.username &&
    a.user?.profile_picture === b.user?.profile_picture &&
    a.niche?.id === b.niche?.id &&
    a.niche?.name === b.niche?.name &&
    a.media === b.media &&
    prev.onLike === next.onLike &&
    prev.onOpenActions === next.onOpenActions &&
    prev.saved === next.saved &&
    prev.onToggleSaved === next.onToggleSaved
  );
});
