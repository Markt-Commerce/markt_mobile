// app/search.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Text, FlatList, Dimensions, TouchableOpacity } from "react-native";
//import MapView, { Marker } from "react-native-maps";
import { Search } from "lucide-react-native";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import { search } from "../services/sections/search";
import { SearchResponse } from "../models/search";
import ProductDisplayComponent from "../components/productDisplayComponent";
import PostDisplayComponent from "../components/PostDisplayComponent";

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
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 flex-row items-center bg-[#f4f1f0] rounded-lg m-4">
        <Search size={24} color="#886963" />
        <TextInput
          className="ml-2 flex-1 text-[#181211] text-base"
          placeholder="Search sellers or products"
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

        { results && results.sellers.length === 0 && results.products.length === 0 && results.posts.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">No results found</Text>
        </View>
      ) : (<>
      <View>
        <Text>Sellers</Text>
        <FlatList
          data={results?.sellers}
          renderItem={({ item }) => (
            /* Reminder to work on a proper UI for this that would link to the seller page as well as
            use the other data sent from the backend */
            <View>
              <Text>{item.shop_name}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
        <TouchableOpacity>
          <Text>View More</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text>Products</Text>
        <FlatList
          data={results?.products}
          renderItem={({ item }) => (
            <ProductDisplayComponent products={[item]} />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
        <TouchableOpacity>
          <Text>View More</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text>Posts</Text>
        <FlatList
          data={results?.posts}
          renderItem={({ item }) => (
            <PostDisplayComponent post={item} />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
        <TouchableOpacity>
          <Text>View More</Text>
        </TouchableOpacity>
      </View>
      </>) }
    </View>
      
  );
}
