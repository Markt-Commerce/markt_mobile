import React, { useState, useMemo } from "react";
import { TouchableOpacity, View, Text, Image, Pressable, Dimensions, Share } from "react-native";
import { Link } from "expo-router";
import { Post } from "../models/feed";
import { likePost } from "../services/sections/post";
import { Heart, MessageCircle, Send } from "lucide-react-native";
import { highlightMentions } from "../utils/highLightMentions";

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
            <TouchableOpacity activeOpacity={0.85} className="px-4 pt-4">
                <View className="rounded-card border border-border bg-white p-4">
                    <View className="flex-row items-center mb-3">
                        <Image
                            source={{ uri: profilePic }}
                            className="w-10 h-10 rounded-full mr-3"
                        />
                        <View>
                            <Text className="font-semibold text-text-primary">
                                {post.user?.username ?? "Unknown"}
                            </Text>
                            <Text className="text-xs text-text-secondary">Post</Text>
                        </View>
                    </View>

                    {post.caption ? (
                        <Text className="mb-3 text-text-primary text-sm leading-5" numberOfLines={3}>
                            {highlightMentions(post.caption)}
                        </Text>
                    ) : null}

                    {imageUrls.length > 0 && (
                        <View className="mb-3">
                            <Image
                                source={{ uri: imageUrls[0] }}
                                className="w-full h-56 rounded-xl"
                            />
                        </View>
                    )}

                    <View className="flex-row mt-3 pt-2 border-t border-border-light gap-6">
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            onPress={handleLike}
                            disabled={isLiking}
                            accessibilityRole="button"
                            accessibilityLabel={`${likeCount} likes`}
                        >
                            <Heart
                                size={18}
                                color={likedByMe ? "#e26136" : "#876d64"}
                                fill={likedByMe ? "#e26136" : "transparent"}
                            />
                            <Text className="text-text-primary text-sm">{likeCount}</Text>
                        </Pressable>
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            accessibilityRole="button"
                            accessibilityLabel={`${post.comment_count} comments`}
                        >
                            <MessageCircle size={18} color="#876d64" />
                            <Text className="text-text-primary text-sm">{post.comment_count}</Text>
                        </Pressable>
                        <Pressable
                            className="flex-row items-center gap-2 py-1 min-h-[44px]"
                            onPress={handleShare}
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