// app/product/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

const mockFetchProduct = async (id: string) => {
  return { id, name: "Sample Product", price: 125, images: [{ media: { original_url: "https://via.placeholder.com/200" } }] };
};

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (id) mockFetchProduct(id).then(setProduct);
  }, [id]);

  if (!product) return <ActivityIndicator size="large" />;

  return (
    <ScrollView className="p-4">
      <Image source={{ uri: product.images[0].media.original_url }} className="w-full h-64 rounded-lg" />
      <Text className="text-2xl font-bold mt-4">{product.name}</Text>
      <Text className="text-lg mt-2">${product.price}</Text>
    </ScrollView>
  );
}
