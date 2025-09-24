import React from "react";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function ErrorScreen(errorMessage: string) {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-between">
      {/* Header */}
      <View>
        <View className="flex flex-row items-center justify-between bg-white p-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex items-center justify-center w-12 h-12"
          >
            <ArrowLeft size={24} color="#181111" />
          </TouchableOpacity>
          <Text className="text-[#181111] text-lg font-bold text-center flex-1 pr-12">
            Error
          </Text>
        </View>

        {/* Image */}
        <View className="flex w-full p-4 bg-white">
          <View className="w-full aspect-[2/3] rounded-xl overflow-hidden">
            <ImageBackground
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbBmIn7tJ2muuSagVEFm6in7ZNqNSXWfeKqtsllT0_cAECryiD0NPGfdP-D_0AqWhe5t9LPhXzdW7Vw4VAfx5kcweAmOhjz-vLPsCml_msfS4dusRgxN8M9q_gOz5uZBa-nH-BHmFjVWb9O1spSS5vYwx7z0HuTuuv66RQE7lz67oiX2gSA59C1Mk1qQGlqYb6IIfhO4Dbp4atDwazVRcPWl_SbKhvF3b1HCaieC5xk7_Tkp_eaJeM10wMl2K4brk6O0LNO0LfTg",
              }}
              className="flex-1"
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title */}
        <Text className="text-[#181111] text-[22px] font-bold text-center px-4 pt-5 pb-3">
          Oops! Something went wrong.
        </Text>

        {/* Description */}
        <Text className="text-[#181111] text-base font-normal text-center px-4 pt-1 pb-3">
          We encountered an error processing your request. Please try again later.
        </Text>
      </View>

      {/* Footer */}
      <View>
        <View className="flex px-4 py-3">
          <TouchableOpacity className="flex flex-1 h-12 min-w-[84px] max-w-[480px] items-center justify-center rounded-full bg-[#e9252b] px-5">
            <Text className="text-white text-base font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
        <View className="h-5 bg-white" />
      </View>
    </View>
  );
}
