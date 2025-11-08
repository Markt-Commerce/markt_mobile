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
        <View className="px-4 pt-3">
            <View className="flex-row justify-between gap-3">
                {products.map((product) => (
                    <View key={product.id} className="w-[48%]">
                        <Link href={`/productDetails/${product.id}`} asChild>
                            <TouchableOpacity activeOpacity={0.85}>
                                <View className="rounded-2xl overflow-hidden border border-[#efe9e7] bg-white">
                                    <ImageBackground
                                        source={{ uri: product.images?.[0]?.media?.original_url }}
                                        className="w-full aspect-square"
                                        resizeMode="cover"
                                    >
                                        <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
                                            <Text className="text-[12px] font-semibold text-[#111418]">
                                                {product.price}
                                            </Text>
                                        </View>
                                    </ImageBackground>

                                    <View className="px-3 pt-2 pb-3">
                                        <Text
                                            className="text-[14px] font-semibold text-[#171311]"
                                            numberOfLines={1}
                                        >
                                            {product.name}
                                        </Text>
                                        <View className="flex-row justify-between mt-2">
                                            <TouchableOpacity
                                                onPress={() => onAdd?.(product)}
                                                className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#f5f2f1]"
                                            >
                                                <ShoppingCart size={16} color="#60758a" />
                                                <Text className="text-[12px] text-[#111418]">Add</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => onChat?.(product)}
                                                className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#f5f2f1]"
                                            >
                                                <MessageCircle size={16} color="#60758a" />
                                                <Text className="text-[12px] text-[#111418]">Chat</Text>
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