// app/product/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProductById } from "../../services/sections/product";
import { ProductDetail } from "../../models/products";


export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail>();


  const fetchProduct = async (id: string) => {
  try {
    const product = await getProductById(id);
    setProduct(product);
  }
  catch (err) {
    //todo: work on displaying errors to users
    console.error("Failed to fetch product:", err);
  }
}

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  if (!product) return <ActivityIndicator size="large" />;

  return (
    <ScrollView className="p-4">
      <Image source={{uri: product.images[0].media.original_url}} className="w-full h-64 rounded-lg" />
      <Text className="text-2xl font-bold mt-4">{product.name}</Text>
      <Text className="text-lg mt-2">${product.price}</Text>
    </ScrollView>
  );
}
