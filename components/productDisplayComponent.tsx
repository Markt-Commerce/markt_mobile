import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, MessageCircle } from "lucide-react-native";
import { Product } from "../models/feed";
import { useTheme } from "./themeProvider";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const mutedIconColor = isDark ? "#c6c5cf" : "#876d64";

  return (
    <View className="px-4 pt-4">
      <View className="flex-row justify-between gap-3">
        {products.map((product) => (
          <View key={product.id} className="w-[48%]">
            <Link href={`/productDetails/${product.id}`} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <View
                  className={`rounded-card overflow-hidden border ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
                >
                  <ImageBackground
                    source={{ uri: product.images?.[0]?.media?.original_url }}
                    className={`w-full aspect-square ${isDark ? "bg-dark-elevated" : "bg-bg-muted"}`}
                    resizeMode="cover"
                  >
                    <View
                      className={`absolute right-2 top-2 rounded-full px-2 py-1 ${isDark ? "bg-dark-surface/90" : "bg-white/90"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${isDark ? "text-dark-text" : "text-text-primary"}`}
                      >
                        {product.price}
                      </Text>
                    </View>
                  </ImageBackground>

                  <View className="px-3 pt-2 pb-3">
                    <Text
                      className={`text-sm font-semibold ${isDark ? "text-dark-text" : "text-text-primary"}`}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <View className="flex-row justify-between mt-2 gap-2">
                      <TouchableOpacity
                        onPress={() => onAdd?.(product)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[36px] justify-center ${isDark ? "bg-dark-elevated" : "bg-bg-muted"}`}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart size={16} color={mutedIconColor} />
                        <Text
                          className={`text-xs font-medium ${isDark ? "text-dark-text" : "text-text-primary"}`}
                        >
                          Add
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onChat?.(product)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full min-h-[36px] justify-center ${isDark ? "bg-dark-elevated" : "bg-bg-muted"}`}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Message seller about ${product.name}`}
                      >
                        <MessageCircle size={16} color={mutedIconColor} />
                        <Text
                          className={`text-xs font-medium ${isDark ? "text-dark-text" : "text-text-primary"}`}
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
