import React from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function ListingsScreen() {
  const listings = [
    {
      id: 1,
      title: "Vintage Leather Jacket",
      price: "$120",
      image: "https://source.unsplash.com/random/800x600/?jacket"
    },
    {
      id: 2,
      title: "Mountain Bike",
      price: "$300",
      image: "https://source.unsplash.com/random/800x600/?bike"
    },
    {
      id: 3,
      title: "Gaming Console",
      price: "$250",
      image: "https://source.unsplash.com/random/800x600/?gaming"
    },
    {
      id: 4,
      title: "Bookshelf",
      price: "$70",
      image: "https://source.unsplash.com/random/800x600/?bookshelf"
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-12 pb-3 bg-white">
        <Text className="text-2xl font-geist font-bold text-black">Listings</Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center px-4 pb-3">
        <View className="flex-row items-center bg-surface flex-1 rounded h-12 px-4">
          <Search size={18} color="#71717A" />
          <TextInput
            placeholder="Search listings"
            placeholderTextColor="#A1A1AA"
            className="ml-2 flex-1 text-black text-base"
          />
        </View>
        <TouchableOpacity className="ml-3 h-12 px-4 rounded bg-primary justify-center items-center">
          <Text className="text-sm text-white font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView className="flex-1 px-4">
        {listings.map((item) => (
          <View key={item.id} className="mb-4 rounded overflow-hidden bg-white border border-border">
            <ImageBackground
              source={{ uri: item.image }}
              className="h-48 w-full bg-cover bg-surface"
              imageStyle={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
            />
            <View className="p-4">
              <Text className="text-lg font-geist font-semibold text-black">{item.title}</Text>
              <Text className="text-tertiary mt-1 font-medium">{item.price}</Text>
            </View>
          </View>
        ))}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
