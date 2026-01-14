import React, { useState } from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { ShoppingCart, MessageCircle } from "lucide-react-native";
import { ProductDetail } from "../models/products";
import { getProductById } from "../services/sections/product";
import { useToast } from "./ToastProvider";

type Props = {
    products: string[] ;
};

const ChatProductDisplayComponent: React.FC<Props> = ({ products }) => {

    const { show } = useToast();
    const [items, setItems] = useState<ProductDetail[]>([]);
    

    async function getProduct(id:string){
        try {
          const result = await getProductById(id);
          return [result]
        } catch (error) {
          show({
            title: "Could not get product",
            message: "Check your internet connection and try again",
            variant: "error"
          })
        }
      }

    React.useEffect(() => {
        (async ()=>{
            const product = await getProduct(products[0])
            if(product) setItems(product)
        })
    }, [products]);

    return (
        <View className="">
            <View className="flex-row justify-between gap-3">
                {items.map((product) => (
                    <View key={product.id} className="">
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

export default ChatProductDisplayComponent;