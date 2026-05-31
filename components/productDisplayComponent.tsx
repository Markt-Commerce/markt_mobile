import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, MessageCircle } from "lucide-react-native";
import { Product } from "../models/feed";

type Props = {
    products: Product[];
    onAdd?: (product: Product) => void;
    onChat?: (product: Product) => void;
};

const ProductDisplayComponent: React.FC<Props> = ({ products, onAdd, onChat }) => {
    return (
        <View className="px-4 pt-4">
            <View className="flex-row justify-between gap-3">
                {products.map((product) => (
                    <View key={product.id} className="w-[48%]">
                        <Link href={`/productDetails/${product.id}`} asChild>
                            <TouchableOpacity activeOpacity={0.85}>
                                <View className="rounded-card overflow-hidden border border-border bg-white">
                                    <ImageBackground
                                        source={{ uri: product.images?.[0]?.media?.original_url }}
                                        className="w-full aspect-square"
                                        resizeMode="cover"
                                    >
                                        <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
                                            <Text className="text-xs font-semibold text-text-primary">
                                                {product.price}
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
                                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-muted min-h-[36px] justify-center"
                                                activeOpacity={0.7}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Add ${product.name} to cart`}
                                            >
                                                <ShoppingCart size={16} color="#876d64" />
                                                <Text className="text-xs font-medium text-text-primary">Add</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => onChat?.(product)}
                                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-muted min-h-[36px] justify-center"
                                                activeOpacity={0.7}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Message seller about ${product.name}`}
                                            >
                                                <MessageCircle size={16} color="#876d64" />
                                                <Text className="text-xs font-medium text-text-primary">Chat</Text>
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