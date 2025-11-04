// app/search.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Text, FlatList, Dimensions } from "react-native";
//import MapView, { Marker } from "react-native-maps";
import { Search } from "lucide-react-native";
import { useRouter } from "expo-router";
import { debounce } from "lodash";

const mockSellers = [
  { id: "1", name: "Jennifer Miller", type: "Seller", latitude: 53.344, longitude: -6.267 },
  { id: "2", name: "David Smith", type: "Seller", latitude: 53.346, longitude: -6.25 },
  { id: "3", name: "Emily Clark", type: "Seller", latitude: 53.342, longitude: -6.26 },
];

const mockProducts = [
  { id: "101", name: "Red Shirt", type: "Product" },
  { id: "102", name: "Blue Sneakers", type: "Product" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(typeof mockSellers[0] | typeof mockProducts[0])[]>([]);

  const performSearch = useCallback(
    debounce((q: string) => {
      if (!q) return setResults([]);
      // filter sellers + products by name
      const filteredSellers = mockSellers.filter((s) =>
        s.name.toLowerCase().includes(q.toLowerCase())
      );
      const filteredProducts = mockProducts.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      );
      setResults([...filteredSellers, ...filteredProducts]);
    }, 500),
    []
  );

  useEffect(() => {
    performSearch(query);
  }, [query]);

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

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        className="bg-white px-4 py-2"
        renderItem={({ item }) => (
          <View className="py-2 border-b border-[#f4f1f0]">
            <Text className="text-[#181211] font-bold text-base">{item.name}</Text>
            <Text className="text-[#886963] text-sm">{item.type}</Text>
          </View>
        )}
      />
    </View>
  );
}
