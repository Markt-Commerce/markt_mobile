import React from "react";
import { Pressable, Text, View } from "react-native";
import { Bookmark, Eye, Heart, MessageCircle, Send } from "lucide-react-native";

type Props = {
  likeCount: number;
  commentCount: number;
  views?: number;
  liked?: boolean;
  saved?: boolean;
  disabled?: boolean;
  isDark?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
};

const compactNumber = (value: number) => {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0)}M`;
};

export default function PostActionBar({
  likeCount,
  commentCount,
  views,
  liked = false,
  saved = false,
  disabled,
  isDark,
  onLike,
  onComment,
  onSave,
  onShare,
}: Props) {
  const muted = isDark ? "#aeb0b7" : "#876d64";
  const textClass = isDark ? "text-[#aeb0b7]" : "text-text-secondary";
  const item = "h-10 min-w-10 px-1 flex-row items-center justify-center gap-1.5";

  return (
    <View className="flex-row items-center justify-between h-10 mt-1 -mx-1">
      <Pressable onPress={onLike} disabled={disabled} className={item} accessibilityRole="button" accessibilityLabel={`${likeCount} likes`}>
        <Heart size={19} color={liked ? "#e26136" : muted} fill={liked ? "#e26136" : "transparent"} />
        {likeCount > 0 ? <Text className={`text-xs ${liked ? "text-primary" : textClass}`}>{compactNumber(likeCount)}</Text> : null}
      </Pressable>
      <Pressable onPress={onComment} className={item} accessibilityRole="button" accessibilityLabel={`${commentCount} comments`}>
        <MessageCircle size={19} color={muted} />
        {commentCount > 0 ? <Text className={`text-xs ${textClass}`}>{compactNumber(commentCount)}</Text> : null}
      </Pressable>
      {typeof views === "number" ? (
        <View className={item} accessibilityRole="text" accessibilityLabel={`${views} views`}>
          <Eye size={19} color={muted} />
          <Text className={`text-xs ${textClass}`}>{compactNumber(views)}</Text>
        </View>
      ) : null}
      <Pressable onPress={onSave} className={item} accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save post"}>
        <Bookmark size={19} color={saved ? "#e26136" : muted} fill={saved ? "#e26136" : "transparent"} />
      </Pressable>
      <Pressable onPress={onShare} className={item} accessibilityRole="button" accessibilityLabel="Share post">
        <Send size={19} color={muted} />
      </Pressable>
    </View>
  );
}
