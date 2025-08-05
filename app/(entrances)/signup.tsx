import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";

export default function SignupScreen() {
  return (
    <View className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full max-w-[480px]">
        <View className="flex-row items-center justify-between pb-2">
          <View className="size-12 justify-center">
            <ArrowLeft color="#171212" size={24} />
          </View>
          <Text className="text-[#171212] text-lg font-bold text-center pr-12 flex-1">
            Sign up
          </Text>
        </View>

        <View className="flex gap-4 py-3">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#826869"
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
          />
          <TextInput
            placeholder="Username"
            placeholderTextColor="#826869"
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#826869"
            secureTextEntry
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
          />
        </View>

        <Text className="text-[#826869] text-sm font-normal text-center underline pb-3 pt-1">
          Already have an account? Log in
        </Text>

        <TouchableOpacity className="w-full h-12 bg-[#e9b8ba] rounded-full justify-center items-center">
          <Text className="text-[#171212] text-base font-bold tracking-[0.015em]">
            Sign up
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}