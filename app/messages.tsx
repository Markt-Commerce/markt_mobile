import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ImageBackground, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRooms } from "../services/sections/chat";
import { RoomListResponse } from "../models/chat";

const messages = [
  {
    id: "1",
    name: "Liam Carter",
    msg: "2 new messages",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCAkr4TIkjUeScnIFAg2ohGSCLlMNIBTmLHn0cOOIyfFyjbjs6Q0zr-xQBQ1pKS0jwyND9kA2-wgyEi5bsPIuhpn5I8iZOU5thOLpT5Qwd96mhDhMyUKwruXifzirVkIt49pDkY1ZjQyJLdE7xleP5YEcKEJUvCKUhWHpBtP0Oeo37SPJKHq_DnYb31HwsPnvkPUyhIDS_0BJRzQWLQM4fOdke2jj_pkmRL5M5H7SzFJi_-zBdVDQDlyw7LQ5MLRLJpNEkGoZDjQ",
  },
  {
    id: "2",
    name: "Olivia Bennett",
    msg: "1 new message",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAOcv4d35C_LJyu0wL5zhz43Qlxhv_cmgErThLpUFLRlHEqF73r8TeApVVsxpOnQ7JFnZScUK60tSmVKPNKxof1xj6b6c3HssS_b6oRibEnn0xFxOJzZQRoO6mC4NQ_-B4uTqJA5hg20v1sE56l3gZKrLa-y814OjIAwBKCsGTvkBOB77chlXcOe6qY762SI-_iI3-3OZPdppufBYSTxbBARnwP8v1fqFKIVlWTNl8to_vXDV9LuMWHQYf6GfP3oWa5hSjJLp9qA",
  },
  {
    id: "3",
    name: "Ethan Harper",
    msg: "3 new messages",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBU80GsLmoAWBVbYLdctb8dzm4oz-RDdu6_prOABRVGLCUO5_tRDPpwEpaeQddffQRu7DRvH8fZcLGgx1vNGiGCF_0yX9zhL37ph147zC0SG_ufWyPhvm4JCJpNiXl1lt48upYy1nj5rdoYxWm-GnBonGSI3VHz5hxIH2bKsaRbycPYowEiEtmDxKA5qh_JbVXqcljdwkfvgIQ_5jLfzNE5DFuoMFMl2jb6hKPuBrNuhC8ABEkJnY7EJXR64Mz3QYHf6U5SPDrImQ",
  },
  // ... Add the rest as needed (Ava Morgan, Jackson Reed, etc.)
];

export default function MessagesScreen() {

  const [chatRooms, setChatRooms] = useState<RoomListResponse>(undefined as unknown as RoomListResponse);

  useEffect(()=>{
    const attemptGetRooms = async () => {
      const result = await getRooms();
      setChatRooms(result)
    }
    attemptGetRooms()
  },[chatRooms])

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <TouchableOpacity className="h-12 w-12 items-center justify-center">
          <ArrowLeft size={24} color="#171312" />
        </TouchableOpacity>
        <Text className="text-[#171312] text-lg font-bold tracking-[-0.015em] text-center pr-12 flex-1">
          Messages
        </Text>
      </View>
      {chatRooms && chatRooms.rooms.length > 0 ? (
        <FlatList
          data={chatRooms.rooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
        <View className="flex-row items-center gap-4 px-4 py-2 min-h-[72px]">
          <ImageBackground
            source={{ uri: item.other_user.profile_picture }}
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
