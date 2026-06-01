/**
 * ChatProductDisplayComponent — Renders a product card in chat
 * CHAT_UI_FRONTEND_INSTRUCTIONS §2.A, CHATS_API §2.4
 * Supports message_data.product (image_url, name, price) or fetch by product_id.
 * Never shows raw IDs. Compact fallbacks for missing image or product.
 */

import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, Package } from "lucide-react-native";
import { ProductDetail } from "../models/products";
import { getProductById } from "../services/sections/product";
import { resolveProductImageUri } from "../utils/imageUri";

type EmbeddedProduct = {
  id: string;
  name?: string;
  /** API returns image_url; support both for compatibility */
  image_url?: string;
  image?: string;
  price?: number | string;
  currency?: string;
};

type Props = {
  productId?: string;
  embeddedProduct?: EmbeddedProduct | null;
  showAddToCart?: boolean;
  onAddToCart?: (productId: string) => void;
};

export default function ChatProductDisplayComponent({
  productId,
  embeddedProduct,
  showAddToCart = true,
  onAddToCart,
}: Props) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const id = embeddedProduct?.id ?? productId;
  const displayName = product?.name ?? embeddedProduct?.name ?? "Product";
  const displayPrice = product?.price ?? (typeof embeddedProduct?.price === "number" ? embeddedProduct.price : Number(embeddedProduct?.price) || 0);
  const displayImage =
    resolveProductImageUri(product) ?? resolveProductImageUri(embeddedProduct);

  useEffect(() => {
    setImageError(false);
  }, [displayImage]);

  useEffect(() => {
    const idToFetch = embeddedProduct?.id ?? productId;
    const embeddedImage = resolveProductImageUri(embeddedProduct);
    const hasEmbeddedMeta =
      embeddedProduct?.id && (embeddedProduct?.name || embeddedProduct?.price != null);

    if (hasEmbeddedMeta && embeddedImage) {
      setProduct(null);
      setLoading(false);
      setError(false);
      return;
    }

    if (!idToFetch) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    getProductById(idToFetch)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        if (!cancelled) setError(!hasEmbeddedMeta);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, embeddedProduct?.id, embeddedProduct?.name, embeddedProduct?.image_url, embeddedProduct?.image]);

  if (!id) return null;

  if (loading) {
    return (
      <View className="rounded overflow-hidden border border-border bg-white min-w-[240px] max-w-[280px] p-3">
        <View className="flex-row gap-3 items-stretch">
          <View className="w-[100px] h-[72px] rounded bg-surface shrink-0" />
          <View className="flex-1 justify-center">
            <View className="h-4 bg-surface rounded w-3/4 mb-2" />
            <View className="h-3 bg-surface rounded w-1/3" />
          </View>
        </View>
        <ActivityIndicator size="small" color="#000000" className="mt-2" />
      </View>
    );
  }

  if (error && !embeddedProduct?.name) {
    return (
      <View className="rounded border border-border bg-surface px-4 py-3">
        <Text className="text-tertiary text-sm">Product no longer available</Text>
      </View>
    );
  }

  return (
    <View className="rounded overflow-hidden border border-border bg-white min-w-[240px] max-w-[280px]">
      <Link href={`/productDetails/${id}`} asChild>
        <TouchableOpacity activeOpacity={0.85}>
          <View className="flex-row p-3 gap-3 items-stretch">
            <View className="w-[100px] h-[72px] rounded bg-surface overflow-hidden items-center justify-center shrink-0">
              {displayImage && !imageError ? (
                <Image
                  source={{ uri: displayImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View className="items-center justify-center p-2">
                  <Package size={20} color="#71717A" />
                  <Text className="text-tertiary text-[9px] mt-0.5">Product</Text>
                </View>
              )}
            </View>
            <View className="flex-1 justify-center min-w-0 py-0.5">
              <Text className="text-black font-semibold text-sm" numberOfLines={2}>
                {displayName}
              </Text>
              <Text className="text-black font-semibold text-base mt-0.5">
                ₦{typeof displayPrice === "number" ? displayPrice.toLocaleString() : String(displayPrice)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      {showAddToCart && onAddToCart && (
        <TouchableOpacity
          onPress={() => onAddToCart(id)}
          className="mx-3 mb-3 py-2.5 rounded bg-primary flex-row items-center justify-center gap-2"
        >
          <ShoppingCart size={18} color="white" />
          <Text className="text-white font-semibold text-sm">Add to Cart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
