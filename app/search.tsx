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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>();
  const [page, setPage] = useState(1);
  const router = useRouter(); 

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q) return setResults(undefined);
      const response = await search(q, page);
      setResults(response);
    }, 500),
    []
  );

  useEffect(() => {
    performSearch(query);
  }, [query, page]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 flex-row items-center bg-[#f4f1f0] rounded-lg m-4 border border-[#e5dedc]">
        <Search size={20} color="#876d64" />
        <TextInput
          className="ml-3 flex-1 text-[#171311] text-base"
          placeholder="Search sellers or products"
          placeholderTextColor="#876d64"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* <MapView
        className="flex-1"
        initialRegion={{
          latitude: 53.344,
          longitude: -6.267,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {results
          .filter((r) => "latitude" in r)
          .map((seller) => (
            <Marker
              key={seller.id}
              coordinate={{ latitude: seller.latitude, longitude: seller.longitude }}
              title={seller.name}
            />
          ))}
      </MapView> */}

      {results && results.sellers.length === 0 && results.products.length === 0 && results.posts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-[#876d64] text-lg font-semibold">No results found</Text>
          <Text className="text-[#876d64] text-sm mt-2">Try searching for different sellers, products, or posts</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Sellers Section */}
          {results?.sellers && results.sellers.length > 0 && (
            <View className="px-4 py-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[#171311] text-lg font-bold">Sellers</Text>
                {results.sellers.length > 3 && (
                  <Link href={{ pathname: "/search", params: { tab: "sellers" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <Text className="text-[#e26136] text-sm font-semibold">View All</Text>
                      <ChevronRight size={16} color="#e26136" />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <FlatList
                data={results.sellers.slice(0, 3)}
                renderItem={({ item }) => (
                  <Link href={`/shopDetails/${item.id}`} asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                      <View className="flex-row items-center gap-3 py-3 px-3 rounded-lg bg-[#f4f1f0] mb-2">
                        <Image
                          source={{ uri: item.profile_picture_url || defaultProfilePicture }}
                          className="w-12 h-12 rounded-full bg-[#e5dedc]"
                        />
                        <View className="flex-1">
                          <Text className="text-[#171311] font-semibold text-base" numberOfLines={1}>
                            {item.shop_name}
                          </Text>
                          <Text className="text-[#876d64] text-xs mt-1">
                            Verified seller
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#876d64" />
                      </View>
                    </TouchableOpacity>
                  </Link>
                )}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Products Section */}
          {results?.products && results.products.length > 0 && (
            <View className="px-4 py-4 border-t border-[#efe9e7]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[#171311] text-lg font-bold">Products</Text>
                {results.products.length > 2 && (
                  <Link href={{ pathname: "/search", params: { tab: "products" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <Text className="text-[#e26136] text-sm font-semibold">View All</Text>
                      <ChevronRight size={16} color="#e26136" />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <View className="flex-row flex-wrap justify-between gap-2">
                {results.products.slice(0, 2).map((product) => (
                  <View key={product.id} className="w-[48%]">
                    <ProductDisplayComponent products={[product]} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Posts Section */}
          {results?.posts && results.posts.length > 0 && (
            <View className="px-4 py-4 border-t border-[#efe9e7]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[#171311] text-lg font-bold">Posts</Text>
                {results.posts.length > 2 && (
                  <Link href={{ pathname: "/search", params: { tab: "posts" } }} asChild>
                    <TouchableOpacity className="flex-row items-center gap-1">
                      <Text className="text-[#e26136] text-sm font-semibold">View All</Text>
                      <ChevronRight size={16} color="#e26136" />
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
              
              <FlatList
                data={results.posts.slice(0, 2)}
                renderItem={({ item }) => (
                  <PostDisplayComponent post={item} />
                )}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          <View className="h-5 bg-white" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
