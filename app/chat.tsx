import React from "react";
import { View, Text, ImageBackground, TextInput, TouchableOpacity } from "react-native";
import { ArrowLeft, Phone, Image as ImageIcon, Camera } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function ChatScreen() {
  const messages = [
    {
      user: "Liam Harper",
      type: "received",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuChFuEopkgQ8NPrwPC2IIIqq32C4MuG0bvrCkxgL-JQrV_mJFfvrKB_5c53QnFu18-KbCXfojFhFwcuS0AlV4SrGqpE9wDnCTLiy3L5ZojaimN7U79befeNpjSIeIZWDwExcBYFZGXhlq1RByeoat5qR7VbHJnou0dwsngOoZUSI--kBPG48uX-gB1UtkIZ-W43gtsgHtL_bfjACbWdBgEGj4rDzNIoJi3yFObKKwv7ErE4gR7f33RiqxKyudLxRtM87twJCEWmkg",
      text: "Hey there! I'm interested in the vintage leather jacket you posted. Is it still available?"
    },
    {
      user: "Sophia Bennett",
      type: "sent",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMx4ApJWR66D8glpEwPKcN9jh8Dd0oYy0id0K7FC1a2JW8606l24LfGCZSqKUw9mkOgjskJkGIBe9Bw9VoRb1fth73_Wd6Z6VG3cPIit8EZY18jUOpU5h-4otH7yJgUv3L5uiWQIOA3Nl8tJOMjRFJ80hgvZj3rvCgwGAyZWIdajo7NH3jQu9ghpKpRJBaPT5GkXOLKnil7vYk0fZdoouvdKePVkPKTz2PrzhCf-fbPY40HfFB8w2lC5d4Z3FGv9YDz9JYDUS88g",
      text: "Hi Liam, yes it is! It's in excellent condition. Would you like more details or photos?"
    },
    // Additional messages omitted for brevity...
  ];

  return (
    <View className="flex-1 bg-[#fcf8f8]">
      {/* Header */}
      <View className="flex-row items-center p-4 pb-2 justify-between">
        <ArrowLeft color="#1b0e0e" size={24} />
        <Text className="text-[#1b0e0e] text-lg font-bold flex-1 text-center">Liam Harper</Text>
        <TouchableOpacity className="w-12 items-end">
          <Phone color="#1b0e0e" size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView className="flex-1">
        {messages.map((msg, index) => (
          <View
            key={index}
            className={`flex flex-row items-end gap-3 p-4 ${msg.type === "sent" ? "justify-end" : ""}`}
          >
            {msg.type === "received" && (
              <ImageBackground
                source={{ uri: msg.avatar }}
                className="w-10 aspect-square rounded-full bg-cover"
              />
            )}
            <View className={`flex flex-1 flex-col gap-1 ${msg.type === "sent" ? "items-end" : "items-start"}`}>
              <Text
                className={`text-[#994d51] text-[13px] max-w-[360px] ${msg.type === "sent" ? "text-right" : "text-left"}`}
              >
                {msg.user}
              </Text>
              <Text
                className={`text-base font-normal max-w-[360px] rounded-lg px-4 py-3 ${msg.type === "sent" ? "bg-[#ea2832] text-[#fcf8f8]" : "bg-[#f3e7e8] text-[#1b0e0e]"}`}
              >
                {msg.text}
              </Text>
            </View>
            {msg.type === "sent" && (
              <ImageBackground
                source={{ uri: msg.avatar }}
                className="w-10 aspect-square rounded-full bg-cover"
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View className="px-4 py-3 gap-3 flex-row items-center">
        <View className="flex-row flex-1 rounded-lg bg-[#f3e7e8] h-12 items-center">
          <TextInput
            className="flex-1 px-4 text-base text-[#1b0e0e] placeholder:text-[#994d51]"
            placeholder="Message..."
            placeholderTextColor="#994d51"
          />
          <View className="flex-row items-center pr-2 gap-2">
            <TouchableOpacity className="p-1.5">
              <ImageIcon color="#994d51" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="p-1.5">
              <Camera color="#994d51" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity className="h-8 px-4 rounded-lg bg-[#ea2832] hidden @[480px]:block">
          <Text className="text-[#fcf8f8] text-sm font-medium">Send</Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-[#fcf8f8]" />
    </View>
  );
}
