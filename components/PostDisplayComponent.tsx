import React, { useMemo, useState } from "react";
import type { Post } from "../models/feed";
import type { FeedPost } from "../types/feed";
import { saveItem, unsaveItem } from "../services/sections/saved";
import FeedPostCard from "./FeedPostCard";
import { useToast } from "./ToastProvider";

interface Props {
  post: Post;
  onLike?: (postId: string) => Promise<void>;
  /** Opens the report / block / share menu.
   *
   * FeedPostCard only draws the overflow button when it is given one, so
   * leaving it out did not look broken -- it looked like a post with no menu.
   * A post seen inside a niche is the one you are most likely to want to
   * report, since it is the one you did not choose to follow. */
  onOpenActions?: (post: FeedPost) => void;
}

/** Adapts legacy post responses to the compact card used by the home feed. */
export default function PostDisplayComponent({
  post,
  onLike,
  onOpenActions,
}: Props) {
  const [saved, setSaved] = useState(post.is_saved ?? false);

  // The server reports this now (markt_python: a saved post now says it is
  // saved). Before, it was always undefined and the bookmark opened empty.
  React.useEffect(() => {
    setSaved(post.is_saved ?? false);
  }, [post.is_saved]);
  const { show } = useToast();

  const feedPost = useMemo<FeedPost>(() => ({
    id: post.id,
    type: "post",
    caption: post.caption ?? null,
    user: {
      id: post.user?.id ?? "",
      username: post.user?.username ?? "Unknown",
      profile_picture: post.user?.profile_picture_url ?? null,
    },
    media: (post.social_media ?? [])
      .filter((item) => Boolean(item?.media?.original_url))
      .map((item) => ({
        url: item.media.original_url,
        type: (item.media as any)?.media_type ?? (item.media as any)?.mime_type ?? "image",
        platform: item.platform,
        post_type: item.post_type,
        aspect_ratio: item.aspect_ratio,
      })),
    likes_count: post.like_count ?? 0,
    comments_count: post.comment_count ?? 0,
    liked_by_me: post.liked_by_me,
    views_count: post.views_count,
    view_count: post.view_count,
    views: post.views,
    is_saved: post.is_saved,
    created_at: post.created_at,
    niche: null,
  }), [post]);

  const toggleSaved = async () => {
    const previous = saved;
    setSaved(!previous);
    try {
      if (previous) await unsaveItem("post", post.id);
      else await saveItem("post", post.id);
    } catch {
      setSaved(previous);
      show({ variant: "error", title: "Could not update saved posts", message: "Please try again." });
    }
  };

  return (
    <FeedPostCard
      post={feedPost}
      onLike={onLike}
      onOpenActions={onOpenActions}
      saved={saved}
      onToggleSaved={toggleSaved}
    />
  );
}
