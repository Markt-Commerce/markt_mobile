import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";

export default function VerificationScreen() {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <View className="w-full max-w-[480px]">
          <Text className="text-[#171212] text-[22px] font-bold leading-tight text-center pb-3 pt-5">
            Verify Your Email
          </Text>
          <Text className="text-[#826869] text-sm font-normal text-center mb-6">
            A verification code has been sent to your email.
          </Text>
  
          <TextInput
            placeholder="Enter verification code"
            placeholderTextColor="#826869"
            className="form-input w-full rounded-xl text-[#171212] bg-[#f4f1f1] h-14 px-4 text-base font-normal mb-4"
          />
  
          <TouchableOpacity className="w-full h-12 bg-[#e9b8ba] rounded-full justify-center items-center">
            <Text className="text-[#171212] text-base font-bold tracking-[0.015em]">
              Verify
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }