import React from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from "react-native";
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
    <View className="flex-1 bg-[#fcf8f8]">
      {/* Header */}
      <View className="px-4 pt-12 pb-3 bg-[#fcf8f8]">
        <Text className="text-2xl font-bold text-[#1b0e0e]">Listings</Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center px-4 pb-3">
        <View className="flex-row items-center bg-[#f3e7e8] flex-1 rounded-lg h-12 px-4">
          <Search size={18} color="#994d51" />
          <TextInput
            placeholder="Search listings"
            placeholderTextColor="#994d51"
            className="ml-2 flex-1 text-[#1b0e0e] text-base"
          />
        </View>
        <TouchableOpacity className="ml-3 h-12 px-4 rounded-lg bg-[#ea2832] justify-center items-center">
          <Text className="text-sm text-[#fcf8f8] font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView className="flex-1 px-4">
        {listings.map((item) => (
          <View key={item.id} className="mb-4 rounded-xl overflow-hidden bg-white shadow">
            <ImageBackground
              source={{ uri: item.image }}
              className="h-48 w-full bg-cover"
              imageStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            />
            <View className="p-4">
              <Text className="text-lg font-semibold text-[#1b0e0e]">{item.title}</Text>
              <Text className="text-[#994d51] mt-1 font-medium">{item.price}</Text>
            </View>
          </View>
        ))}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
