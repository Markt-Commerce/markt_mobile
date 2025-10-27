import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ImageBackground, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRooms } from "../../services/sections/chat";
import { RoomListResponse } from "../../models/chat";
import { useRouter } from "expo-router";

export default function MessagesScreen() {

  const [chatRooms, setChatRooms] = useState<RoomListResponse>(undefined as unknown as RoomListResponse);
  const router = useRouter();

  useEffect(()=>{
    const attemptGetRooms = async () => {
      const result = await getRooms();
      console.log("Fetched chat rooms:", result);
      setChatRooms(result)
    }
    attemptGetRooms()
  },[]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Text className="text-[#171312] text-lg font-bold tracking-[-0.015em] text-center pr-12 flex-1">
          Messages
        </Text>
      </View>
      {chatRooms && chatRooms.rooms.length > 0 ? (
        <FlatList
          data={chatRooms.rooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.7} >
            <View className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]" >
              <ImageBackground
                source={{ uri: item.other_user?.profile_picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }}
                className="h-14 w-14 rounded-full overflow-hidden"
                resizeMode="cover"
              />
              <View className="flex-col justify-center">
                <Text className="text-[#171312] text-base font-medium leading-normal">
              {item.last_message?.sender_username}
                </Text>
                <Text className="text-[#826f68] text-sm leading-normal">
              {item.last_message?.content}
                </Text>
              </View>
            </View>
        </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#171312] text-lg font-bold">No messages</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
