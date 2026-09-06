import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, MessageCircle } from "lucide-react-native";
import { Product } from "../models/feed";
import { useTokens } from "../theme/useTokens";
import { formatPrice } from "../utils/money";

type Props = {
  products: Product[];
  onAdd?: (product: Product) => void;
  onChat?: (product: Product) => void;
};

const ProductDisplayComponent: React.FC<Props> = ({
  products,
  onAdd,
  onChat,
}) => {
  const t = useTokens();
  const mutedIconColor = t.textSecondary;

  return (
    <View className="px-4 pt-4">
      <View className="flex-row justify-between gap-3">
        {products.map((product) => (
          <View key={product.id} className="w-[48%]">
            <Link href={`/productDetails/${product.id}`} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <View
                  className="rounded-card overflow-hidden border bg-surface-raised border-border"
                >
                  <ImageBackground
                    source={{ uri: product.images?.[0]?.media?.original_url }}
                    className="w-full aspect-square bg-surface-sunken"
                    resizeMode="cover"
                  >
                    {/* A filled brand pill, matching the feed card. The chip
                        used to be surface-raised at 90% — which is white in
                        light mode, so the price vanished over any pale
                        product photo — and the number was printed raw, with
                        no currency symbol and no thousands separator. */}
                    <View className="absolute right-2 top-2 rounded-full px-2.5 py-1 bg-primary-fill">
                      <Text className="text-xs font-bold text-text-on-primary">
                        {formatPrice(product.price)}
                      </Text>
                    </View>
                  </ImageBackground>

                  <View className="px-3 pt-2 pb-3">
                    <Text
                      className="text-sm font-semibold text-text-primary"
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <View className="flex-row justify-between mt-2 gap-2">
                      <TouchableOpacity
                        onPress={() => onAdd?.(product)}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[36px] justify-center bg-surface-sunken"
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart size={16} color={mutedIconColor} />
                        <Text
                          className="text-xs font-medium text-text-primary"
                        >
                          Add
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onChat?.(product)}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[36px] justify-center bg-surface-sunken"
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Message seller about ${product.name}`}
                      >
                        <MessageCircle size={16} color={mutedIconColor} />
                        <Text
                          className="text-xs font-medium text-text-primary"
                        >
                          Chat
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProductDisplayComponent;
