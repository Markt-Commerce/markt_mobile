import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { ScrollView } from "react-native";
import { useTheme } from "../components/themeProvider";

export default function ListingsScreen() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const mutedColor = isDark ? "#c6c5cf" : "#71717A";

  const listings = [
    {
      id: 1,
      title: "Vintage Leather Jacket",
      price: "$120",
      image: "https://source.unsplash.com/random/800x600/?jacket",
    },
    {
      id: 2,
      title: "Mountain Bike",
      price: "$300",
      image: "https://source.unsplash.com/random/800x600/?bike",
    },
    {
      id: 3,
      title: "Gaming Console",
      price: "$250",
      image: "https://source.unsplash.com/random/800x600/?gaming",
    },
    {
      id: 4,
      title: "Bookshelf",
      price: "$70",
      image: "https://source.unsplash.com/random/800x600/?bookshelf",
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-page" : "bg-white"}`}>
      {/* Header */}
      <View
        className={`px-4 pt-12 pb-3 ${isDark ? "bg-dark-page" : "bg-white"}`}
      >
        <Text
          className={`text-2xl font-geist font-bold ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Listings
        </Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center px-4 pb-3">
        <View
          className={`flex-row items-center flex-1 rounded h-12 px-4 ${isDark ? "bg-dark-surface" : "bg-surface"}`}
        >
          <Search size={18} color={mutedColor} />
          <TextInput
            placeholder="Search listings"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            className={`ml-2 flex-1 text-base ${isDark ? "text-dark-text" : "text-black"}`}
          />
        </View>
        <TouchableOpacity className="ml-3 h-12 px-4 rounded bg-primary justify-center items-center">
          <Text className="text-sm text-white font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <ScrollView className="flex-1 px-4">
        {listings.map((item) => (
          <View
            key={item.id}
            className={`mb-4 rounded overflow-hidden border ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}
          >
            <ImageBackground
              source={{ uri: item.image }}
              className={`h-48 w-full bg-cover ${isDark ? "bg-dark-elevated" : "bg-surface"}`}
              imageStyle={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
            />
            <View className="p-4">
              <Text
                className={`text-lg font-geist font-semibold ${isDark ? "text-dark-text" : "text-black"}`}
              >
                {item.title}
              </Text>
              <Text
                className={`${isDark ? "text-dark-muted" : "text-tertiary"} mt-1 font-medium`}
              >
                {item.price}
              </Text>
            </View>
          </View>
        ))}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
