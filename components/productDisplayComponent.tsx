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
        <View className="px-6 py-4">
            <View className="flex-row justify-between gap-4">
                {products.map((product) => (
                    <View key={product.id} className="w-[48%]">
                        <Link href={`/productDetails/${product.id}`} asChild>
                            <TouchableOpacity activeOpacity={0.85}>
                                <View className="rounded overflow-hidden border border-border bg-white">
                                    <ImageBackground
                                        source={{ uri: product.images?.[0]?.media?.original_url }}
                                        className="w-full aspect-[4/5] bg-surface"
                                        resizeMode="cover"
                                    >
                                        <View className="absolute right-3 top-3 rounded bg-white/90 px-3 py-1.5 shadow-sm">
                                            <Text className="text-[11px] font-geist font-bold text-black">
                                                ₦{(product.price ?? 0).toLocaleString()}
                                            </Text>
                                        </View>
                                    </ImageBackground>

                                    <View className="px-4 pt-3 pb-4">
                                        <Text
                                            className="text-sm font-geist font-bold text-black"
                                            numberOfLines={1}
                                        >
                                            {product.name}
                                        </Text>
                                        <View className="flex-row justify-between mt-3 gap-2">
                                            <TouchableOpacity
                                                onPress={() => onAdd?.(product)}
                                                className="flex-1 flex-row items-center gap-1.5 px-2 py-1.5 rounded bg-surface border border-border min-h-[32px] justify-center"
                                                activeOpacity={0.7}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Add ${product.name} to cart`}
                                            >
                                                <ShoppingCart size={14} color="#71717A" />
                                                <Text className="text-[10px] font-geist font-bold text-black">Add</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => onChat?.(product)}
                                                className="flex-1 flex-row items-center gap-1.5 px-2 py-1.5 rounded bg-surface border border-border min-h-[32px] justify-center"
                                                activeOpacity={0.7}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Message seller about ${product.name}`}
                                            >
                                                <MessageCircle size={14} color="#71717A" />
                                                <Text className="text-[10px] font-geist font-bold text-black">Chat</Text>
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