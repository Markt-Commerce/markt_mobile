import React, { useState, useMemo } from "react";
import { TouchableOpacity, View, Text, Image, Pressable, FlatList, Dimensions } from "react-native";
import { Link } from "expo-router";
import { Post } from "../models/feed";
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
        setLikeCount((c) => c + 1); // optimistic
        try {
            if (onLike) await onLike(post.id);
        } catch (err) {
            // revert on failure
            setLikeCount((c) => Math.max(0, c - 1));
            console.error("unable to like this post", err);
        } finally {
            setIsLiking(false);
        }
    };

    const cardWidth = SCREEN_WIDTH - 32; // 16px padding on each side (px-4)

    return (
        <Link href={`/postDetails/${post.id}`} asChild>
            <TouchableOpacity activeOpacity={0.85} className="px-4 pt-3">
                <View className="rounded-2xl border border-[#efe9e7] bg-white p-4">
                    <View className="flex-row items-center mb-3">
                        <Image
                            source={{ uri: profilePic }}
                            className="w-10 h-10 rounded-full mr-3"
                        />
                        <View>
                            <Text className="font-semibold text-[#111418]">
                                {post.user?.username ?? "Unknown"}
                            </Text>
                            <Text className="text-xs text-[#876d64]">Post</Text>
                        </View>
                    </View>

                    {post.caption ? (
                        <Text className="mb-3 text-[#111418]" numberOfLines={3}>
                            {highlightMentions(post.caption)}
                        </Text>
                    ) : null}

                    {/* Image Grid or Single Image */}
                    {imageUrls.length > 0 && (
                        <View className="mb-3 relative">
                            {imageUrls.length === 1 ? (
                                // Single image
                                <Image
                                    source={{ uri: imageUrls[0] }}
                                    className="w-full h-56 rounded-xl"
                                />
                            ) : (
                                // Multiple images - Instagram grid
                                <View>
                                    <FlatList
                                        data={imageUrls}
                                        keyExtractor={(_, idx) => idx.toString()}
                                        numColumns={3}
                                        scrollEnabled={false}
                                        renderItem={({ item, index }) => (
                                            <View style={{ width: `${100 / 3}%`, padding: 2 }}>
                                                <Image
                                                    source={{ uri: item }}
                                                    style={{ aspectRatio: 1, borderRadius: 8 }}
                                                />
                                            </View>
                                        )}
                                    />
                                    {/* Badge showing total images */}
                                    <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-lg">
                                        <Text className="text-white text-xs font-semibold">
                                            +{imageUrls.length}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View className="flex-row justify-between mt-3">
                        <Pressable
                            className="flex-row items-center gap-2"
                            onPress={handleLike}
                            disabled={isLiking}
                        >
                            <Heart size={18} color="#60758a" />
                            <Text className="text-[#111418]">{likeCount}</Text>
                        </Pressable>

                        <Pressable className="flex-row items-center gap-2">
                            <MessageCircle size={18} color="#60758a" />
                            <Text className="text-[#111418]">{post.comment_count}</Text>
                        </Pressable>

                        <Pressable>
                            <Send size={18} color="#60758a" />
                        </Pressable>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
}