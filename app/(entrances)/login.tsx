import React from "react";
import { useRouter, Link } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full max-w-[480px]">
        <Text className="text-[#171212] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
          Welcome back
        </Text>

        <View className="flex flex-wrap items-end gap-4 py-3">
          <TextInput
            placeholder="Username"
            placeholderTextColor="#826869"
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
          />
        </View>

        <View className="flex flex-wrap items-end gap-4 py-3">
          <TextInput
            placeholder="Password"
            placeholderTextColor="#826869"
            secureTextEntry
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal"
          />
        </View>

        <Link href={
          "/forgotPassword"
        }>
          <Text className="text-[#826869] text-sm font-normal text-center underline pb-3 pt-1">
            Forgot Password?
          </Text>
        </Link>

        <TouchableOpacity className="w-full h-12 bg-[#e9b8ba] rounded-full justify-center items-center">
          <Text className="text-[#171212] text-base font-bold tracking-[0.015em]">
            Login
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-5 bg-white" />
    </View>
  );
}
