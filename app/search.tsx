// app/search.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Text, FlatList, Dimensions, TouchableOpacity, Image, ScrollView, SafeAreaView } from "react-native";
//import MapView, { Marker } from "react-native-maps";
import { Search, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Link } from "expo-router";
import { debounce } from "lodash";
import { search } from "../services/sections/search";
import { SearchResponse } from "../models/search";
import ProductDisplayComponent from "../components/productDisplayComponent";
import PostDisplayComponent from "../components/PostDisplayComponent";
import { defaultProfilePicture } from "../models/defaults";
import { useTheme } from "../components/themeProvider";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>();
  const [page, setPage] = useState(1);
  const router = useRouter(); 
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const performSearch = useCallback(
    debounce(async (q: string, p: number) => {
      if (!q.trim()) return setResults(undefined);
      const response = await search(q.trim(), p);
      setResults(response);
    }, 350),
    []
  );

  useEffect(() => {
    performSearch(query, 1);
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }}>
      {/* Search Input */}
      <View className={`px-6 py-6 border-b ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        <View className={`h-14 px-5 flex-row items-center rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
          <Search size={20} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.5} />
          <TextInput
            className={`ml-4 flex-1 font-geist font-semibold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
            placeholder="DISCOVER CONTENT"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            value={query}
            onChangeText={setQuery}
            selectionColor={isDark ? "#f0f1f2" : "#000000"}
          />
        </View>
      </View>

      {results && results.sellers.length === 0 && results.products.length === 0 && results.posts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-12">
          <View className={`w-24 h-24 rounded items-center justify-center mb-8 border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <Search size={40} color={isDark ? "#c6c5cf" : "#A1A1AA"} strokeWidth={1} />
          </View>
          <Text className={`font-geist font-bold text-xl text-center leading-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>No results found</Text>
          <Text className={`font-inter text-center mt-4 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Our search couldn't find a match for your query. Try different keywords or explore trending categories.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Sellers Section */}
          {results?.sellers && results.sellers.length > 0 && (
            <View className="py-8">
              <View className="flex-row items-center justify-between mb-6 px-6">
                <Text className={`font-geist font-bold text-xs tracking-[0.2em] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Sellers</Text>
                {results.sellers.length > 3 && (
                  <Link href={{ pathname: "/search", params: { tab: "sellers" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-2">
                      <Text className={`font-geist font-bold text-[10px] tracking-widest uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Explore All</Text>
                      <ChevronRight size={14} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2} />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <View className="px-6">
                {results.sellers.slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/shopDetails/${item.id}`} asChild>
                    <TouchableOpacity activeOpacity={0.8} className="mb-4">
                      <View className={`flex-row items-center gap-4 p-5 rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-white border-border"}`}>
                        <Image
                          source={{ uri: item.profile_picture_url || defaultProfilePicture }}
                          className={`w-16 h-16 rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}
                        />
                        <View className="flex-1">
                          <Text className={`font-geist font-bold text-sm tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                            {item.shop_name}
                          </Text>
                          <Text className={`font-geist font-bold text-[9px] tracking-widest uppercase mt-2 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                            Curated Store
                          </Text>
                        </View>
                        <ChevronRight size={20} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1} />
                      </View>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </View>
          )}

          {/* Products Section */}
          {results?.products && results.products.length > 0 && (
            <View className={`py-8 border-t ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <View className="flex-row items-center justify-between mb-6 px-6">
                <Text className={`font-geist font-bold text-xs tracking-[0.2em] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Products</Text>
                {results.products.length > 2 && (
                  <Link href={{ pathname: "/search", params: { tab: "products" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-2">
                      <Text className={`font-geist font-bold text-[10px] tracking-widest uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>View All</Text>
                      <ChevronRight size={14} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2} />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <View className="flex-row flex-wrap px-6 justify-between gap-y-8">
                {results.products.slice(0, 4).map((product) => (
                  <View key={product.id} className="w-[48%]">
                    <ProductDisplayComponent products={[product]} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Posts Section */}
          {results?.posts && results.posts.length > 0 && (
            <View className={`py-8 border-t ${isDark ? "border-[#46464e]" : "border-border"}`}>
              <View className="flex-row items-center justify-between mb-6 px-6">
                <Text className={`font-geist font-bold text-xs tracking-[0.2em] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Social Feed</Text>
                {results.posts.length > 2 && (
                  <Link href={{ pathname: "/search", params: { tab: "posts" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-2">
                      <Text className={`font-geist font-bold text-[10px] tracking-widest uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>Explore Feed</Text>
                      <ChevronRight size={14} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={2} />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <View className="px-6">
                {results.posts.slice(0, 2).map((item) => (
                  <View key={item.id} className="mb-4">
                     <PostDisplayComponent post={item} />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={`h-10 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
