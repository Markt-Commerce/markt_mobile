import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 pb-2 justify-between">
        <ArrowLeft size={24} color="#171311" />
        <Text className="text-[#171311] text-lg font-bold text-center pr-12">
          Profile
        </Text>
      </View>

      {/* Profile Image & Info */}
      <View className="p-4 items-center">
        <View className="items-center gap-4">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBV3jnY8apsheCMngH9NM_uxgSXDUvMIII2hb5QV1iTKkiE8G8c_VTE3v_ZPFd4IylwS13KbWuCYfGNiCFRrqqX7ae3wtC17_v_BPlZls7h30payQZwccwjuk0xKGfof45wQwSmsKyqsABNxgJT5zmQ9KjTuwTsxKNC04-uCd8Xt88awjdF5k7eRayAkSgjEQtm-GN931PnLZRntDF1N_18ZCBE-SGAoZ_roZ5ZVs5v3wkXXwkqgZcZkIsqzA3G3fnctkUcGP4e0A",
            }}
            className="rounded-full w-32 h-32 bg-center"
          />
          <View className="items-center">
            <Text className="text-[22px] font-bold text-[#171311] text-center">
              Sophia Carter
            </Text>
            <Text className="text-base text-[#876d64] text-center">
              @sophia.carter
            </Text>
            <Text className="text-base text-[#876d64] text-center">
              Joined 2021
            </Text>
          </View>
        </View>
      </View>

      {/* Details Section */}
      <Text className="text-lg font-bold text-[#171311] px-4 pt-4 pb-2">
        Details
      </Text>

      {[
        { label: "Name", value: "Sophia Carter" },
        { label: "Username", value: "@sophia.carter" },
        { label: "Gender", value: "Female" },
        { label: "Location", value: "Los Angeles, CA" },
        { label: "Joined", value: "2021" },
      ].map((item, index) => (
        <TouchableOpacity
          key={index}
          className="flex-row justify-between items-center px-4 py-2 min-h-[72px]"
        >
          <View>
            <Text className="text-base font-medium text-[#171311]">
              {item.label}
            </Text>
            <Text className="text-sm text-[#876d64]">
              {item.value}
            </Text>
          </View>
          <ArrowRight size={24} color="#171311" />
        </TouchableOpacity>
      ))}

      {/* Settings Section */}
      <Text className="text-lg font-bold text-[#171311] px-4 pt-4 pb-2">
        Settings
      </Text>

      {[
        "Notifications",
        "Privacy",
        "Help"
      ].map((label, index) => (
        <TouchableOpacity
          key={index}
          className="flex-row justify-between items-center px-4 py-3 min-h-14"
        >
          <Text className="text-base text-[#171311] flex-1 truncate">
            {label}
          </Text>
          <ArrowRight size={24} color="#171311" />
        </TouchableOpacity>
      ))}

      <View className="h-5 bg-white" />
    </ScrollView>
  );
}
