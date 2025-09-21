// app/post/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

const mockFetchPost = async (id: string) => {
  return { id, caption: "Sample Post", like_count: 20, comment_count: 5 };
};

const mockFetchComments = async (id: string, page: number) => {
  return Array.from({ length: 5 }, (_, i) => ({ id: i + page * 5, text: `Comment ${i}` }));
};

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) mockFetchPost(id).then(setPost);
  }, [id]);

  const loadComments = async () => {
    if (loading) return;
    setLoading(true);
    const newComments = await mockFetchComments(id!, page);
    setComments((prev) => [...prev, ...newComments]);
    setPage((prev) => prev + 1);
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadComments();
  }, [id]);

  if (!post) return <ActivityIndicator size="large" />;

  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-bold">{post.caption}</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text className="p-2 border-b">{item.text}</Text>}
        onEndReached={loadComments}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="small" /> : null}
      />
    </View>
  );
}
