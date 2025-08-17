import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft, Image as ImageIcon } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../../components/inputs";
import { useUser } from "../../models/userContextProvider";
import { AccountType } from "../../models/auth";
import { useRouter } from "expo-router";
import { register,useRegData } from "../../models/signupSteps";
import * as ImagePicker from "expo-image-picker";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

export default function UserInfoScreen() {

  const { setUser, setRole, role } = useUser();
  const { regData, setRegData } = useRegData();
  
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });


  return (
    <ScrollView className="flex-1 bg-white">
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

      {/* Save button */}
      <View>
        <View className="flex px-4 py-3">
          <TouchableOpacity className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#e9242a] px-5">
            <Text className="text-white text-base font-bold tracking-[0.015em] truncate">Save</Text>
          </TouchableOpacity>
        </View>
        <View className="h-5 bg-white" />
      </View>
      </View>
    </ScrollView>
  );
}
