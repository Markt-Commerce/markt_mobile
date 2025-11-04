import React from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from "react-native";
import { ArrowLeft, Search } from "lucide-react-native";

const followers = [
  {
    name: "Jennifer Miller",
    username: "@jennifer.m",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuMNMz5edIk8xyBDq7RNux8YPqz8oBXhYymTBaYV4wqkwvSpyE6Jh_BHP9xyXptmFlyig_n6GBBmXcoO72lzr3EC292CdtKJ8qkJpASGHY_25kFk-g73jKHfV04cz9B8M23FMCXH6a077sw0XHE2u9i9AagoWIVBuJIh10caPPEFe54HD2utZabSMUJcICJsiwzN-AmTylhB12VzKt17Q2K0WulebQONciZHccTO-WLKE6DvmisBakSl2Rhyz9BZR-HpNbYyW-QA",
  },
  {
    name: "David Smith",
    username: "@david.s",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAChUfGoPkzdtYKLRyi91NKFwzP0J2B1MCtqc4rvkMAZZzzrFmC7qvOc8zflkV_8YLusMCe_IwPbn-z3jmsIRbc0HJzv1T16kVrsAWnEXSs6XTM71-3zRGsogAKRQZBowkP0E2Aac1LCyk1hQGCN-IH9KulRtZp3Hy0elHQSpchDW93yY7qKGtrZue8IJ_NJzpLoR9hTAQfIZ3GO3pJSxvQIcqZSG0vecC281zCqcjQS6N1iV_SJfkEhYfTNJ-BuVNfanG572CofA",
  },
  {
    name: "Emily Clark",
    username: "@emily.c",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiLxCtE5_6-mYRnpJmVq1MvFtE2Zr5hfXi1g0w86ZKhVW3jtJbV0ArNcaRyLZgmVHu7Qy0EQtUkv998tdSSSTMA5CM23S7lakr9f7YPQMrwxpLhU8h89P6H9dAlX2p1JvGrb8xyeseEXYHmo0NtzQRQt9aXNJXhRAsFH3vkH6DG3RMpr8ZoEnIWZ2p8sGTGbCy4y3EaRDcdC9IxKC-ftZBj2_fmoFEK7Rzwo0yKytAMuKAQukZB4mK6qsdCuyQdFZYSyD3zwb-Jw",
  },
  // Add the rest later as needed
];

export default function FollowersScreen({ navigation }: any) {
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center bg-white p-4 pb-2 justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ArrowLeft size={24} color="#181211" />
        </TouchableOpacity>
        <Text className="text-[#181211] text-lg font-bold flex-1 text-center pr-12">
          Followers
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-[#f4f1f0] rounded-lg h-12 px-3">
          <Search size={22} color="#886963" />
          <TextInput
            placeholder="Search followers"
            placeholderTextColor="#886963"
            className="flex-1 text-[#181211] pl-3 text-base"
          />
        </View>
      </View>

      {/* Followers List */}
      <FlatList
        data={followers}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 px-4 py-3">
            <Image
              source={{ uri: item.avatar }}
              className="h-14 w-14 rounded-full bg-gray-200"
            />
            <View className="flex-col justify-center">
              <Text className="text-[#181211] text-base font-medium">
                {item.name}
              </Text>
              <Text className="text-[#886963] text-sm">{item.username}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
