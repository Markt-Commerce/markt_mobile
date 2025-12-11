import React, {useEffect} from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from "react-native";
import { ArrowLeft, Search } from "lucide-react-native";
import { getSellerFollowersCount, getSellerFollowers } from "../../services/sections/users";
import { useLocalSearchParams } from "expo-router";
import { User } from "../../models/user";

export default function FollowersScreen({ navigation }: any) {

  const [followersList, setFollowersList] = React.useState<User[]>([]);
  const [followersCount, setFollowersCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const { id } = useLocalSearchParams();
  

  const getFollowers = async () => {
    try {
      const sellerId = id;
      const count = await getSellerFollowersCount(sellerId as string);
      const followers = await getSellerFollowers(sellerId as string);
      setFollowersList(followers);
      setFollowersCount(count.count);
      console.log(`Seller has ${count.count} followers.`);
      // You can update the state or UI based on the count if needed
    } catch (error) {
      console.error("Error fetching followers count:", error);
    }
  }

  useEffect(() => {
    getFollowers();
  }, []);


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
        data={followersList}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-4 px-4 py-3">
            <Image
              source={{ uri: item.profile_picture }}
              className="h-14 w-14 rounded-full bg-gray-200"
            />
            <View className="flex-col justify-center">
              <Text className="text-[#181211] text-base font-medium">
                {item.username}
              </Text>
              <Text className="text-[#886963] text-sm">{item.username}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
