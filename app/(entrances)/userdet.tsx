import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft, Image as ImageIcon } from "lucide-react-native";

export default function UserInfoScreen() {
  return (
    <ScrollView className="flex-1 bg-white justify-between">
      <View>
        {/* Header */}
        <View className="flex flex-row items-center bg-white p-4 pb-2 justify-between">
          <ArrowLeft size={24} color="#181111" />
          <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
            Your info
          </Text>
        </View>

        {/* Name input */}
        <View className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
          <View className="flex flex-col min-w-40 flex-1">
            <TextInput
              placeholder="Name"
              placeholderTextColor="#886364"
              className="form-input w-full flex-1 rounded-xl text-[#181111] bg-[#f4f0f0] h-14 px-4 text-base"
            />
          </View>
        </View>

        {/* Profile Photo */}
        <Text className="text-[#181111] text-lg font-bold px-4 pb-2 pt-4">Profile photo</Text>
        <View className="flex flex-row items-center gap-4 px-4 min-h-14">
          <View className="flex items-center justify-center rounded-lg bg-[#f4f0f0] size-10">
            <ImageIcon size={24} color="#181111" />
          </View>
          <Text className="text-[#181111] text-base flex-1 truncate">Upload photo</Text>
        </View>

        {/* Interests */}
        <Text className="text-[#181111] text-lg font-bold px-4 pb-2 pt-4">Interests</Text>
        <Text className="text-[#181111] text-base px-4 pt-1 pb-3">
          Select the categories you're most interested in. This helps us personalize your feed.
        </Text>

        <View className="px-4">
          {[
            "Fashion",
            "Electronics",
            "Home & Garden",
            "Sports & Outdoors",
            "Books & Media",
            "Toys & Games",
          ].map((interest, index) => (
            <View key={index} className="flex flex-row items-center gap-x-3 py-3">
              <View className="h-5 w-5 rounded border-[#e5dcdc] border-2 bg-transparent" />
              <Text className="text-[#181111] text-base">{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Save button */}
      <View>
        <View className="flex px-4 py-3">
          <TouchableOpacity className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#e9242a] px-5">
            <Text className="text-white text-base font-bold tracking-[0.015em] truncate">Save</Text>
          </TouchableOpacity>
        </View>
        <View className="h-5 bg-white" />
      </View>
    </ScrollView>
  );
}
