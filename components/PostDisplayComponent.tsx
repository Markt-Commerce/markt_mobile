import React, { useState, useMemo } from "react";
import { TouchableOpacity, View, Text, Image, Pressable, Dimensions, Share } from "react-native";
import { Link } from "expo-router";
import { Post } from "../models/feed";
import { likePost } from "../services/sections/post";
import { Heart, MessageCircle, Send } from "lucide-react-native";
import { highlightMentions } from "../utils/highLightMentions";
import { useTheme } from "./themeProvider";

// /c:/Users/Administrator/markt_mobile/components/PostDisplayComponent.tsx

type Media = { original_url?: string | null };
type SocialMediaItem = { media?: Media | null };
type User = { username?: string | null; profile_picture_url?: string | null };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
    post: Post;
    /**
     * Optional callback used to perform the "like" action.
     * Should throw/reject on failure. If omitted, the component will optimistically
     * increment the like count but won't persist it anywhere.
     */
    onLike?: (postId: string) => Promise<void>;
}

export default function PostDisplayComponent({ post, onLike }: Props) {
    const [likeCount, setLikeCount] = useState<number>(post.like_count ?? 0);
    const [likedByMe, setLikedByMe] = useState<boolean>(post.liked_by_me ?? false);
    const [isLiking, setIsLiking] = useState<boolean>(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const profilePic =
        post.user?.profile_picture_url && post.user.profile_picture_url.length > 0
            ? post.user.profile_picture_url
            : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    // Get all image URLs from social_media array
    const imageUrls = useMemo(() => {
        return (post.social_media ?? [])
            .map((item) => item?.media?.original_url)
            .filter((url): url is string => !!url);
    }, [post.social_media]);

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        const prevLiked = likedByMe;
        const prevCount = likeCount;
        setLikedByMe(!likedByMe);
        setLikeCount((c) => (likedByMe ? Math.max(0, c - 1) : c + 1));
        try {
            if (onLike) await onLike(post.id);
            else await likePost(post.id);
        } catch (err) {
            setLikedByMe(prevLiked);
            setLikeCount(prevCount);
            console.error("unable to like this post", err);
        } finally {
            setIsLiking(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: "Check out this post on Markt",
                url: `markt://post/${post.id}`,
                title: "Share post",
            });
        } catch {
            // User cancelled or share failed
        }
    };

    const cardWidth = SCREEN_WIDTH - 32; // 16px padding on each side (px-4)

    return (
        <Link href={`/postDetails/${post.id}`} asChild>
            <TouchableOpacity activeOpacity={0.85} className="px-6 pt-6">
                <View className={`rounded border p-5 ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
                    <View className="flex-row items-center mb-4">
                        <Image
                            source={{ uri: profilePic }}
                            className={`w-10 h-10 rounded mr-3 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                        />
                        <View>
                            <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                                {post.user?.username ?? "Unknown"}
                            </Text>
                            <Text className={`text-[10px] font-geist font-bold uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Post</Text>
                        </View>
                    </View>

                    {post.caption ? (
                        <Text className={`mb-4 font-inter text-sm leading-6 ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={3}>
                            {highlightMentions(post.caption)}
                        </Text>
                    ) : null}

                    {imageUrls.length > 0 && (
                        <View className="mb-4 overflow-hidden rounded">
                            <Image
                                source={{ uri: imageUrls[0] }}
                                className={`w-full h-64 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    <View className={`flex-row mt-3 pt-3 border-t gap-6 ${isDark ? "border-[#46464e]" : "border-border"}`}>
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            onPress={handleLike}
                            disabled={isLiking}
                            accessibilityRole="button"
                            accessibilityLabel={`${likeCount} likes`}
                        >
                            <Heart
                                size={18}
                                strokeWidth={1.5}
                                color={likedByMe ? "#E94C2A" : (isDark ? "#c6c5cf" : "#71717A")}
                                fill={likedByMe ? "#E94C2A" : "transparent"}
                            />
                            <Text className={`font-inter text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{likeCount}</Text>
                        </Pressable>
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            accessibilityRole="button"
                            accessibilityLabel={`${post.comment_count} comments`}
                        >
                            <MessageCircle size={18} strokeWidth={1.5} color={isDark ? "#c6c5cf" : "#71717A"} />
                            <Text className={`font-inter text-sm ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{post.comment_count}</Text>
                        </Pressable>
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            onPress={handleShare}
                            accessibilityRole="button"
                            accessibilityLabel="Share post"
                        >
                            <Send size={18} strokeWidth={1.5} color={isDark ? "#c6c5cf" : "#71717A"} />
                        </Pressable>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
}