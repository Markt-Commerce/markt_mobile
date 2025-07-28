import React from "react";
import { ImageBackground, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const backgroundImage = {
  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6-rNWpIDIK-9az4-X4Pe-y3DZyo4Q9zslq6Sbg3k6CNx_85p8pcS9iEGMQw6XbIxkb71smcp_6zp6w3yvAEh32wERgmJK4nObVY7L3sVLB-jaqDtZ3RAmkzdXuYJcgjBgl7ZLuoWhgJ2JDwo87T2xX2r5hzlQchx9pTEDDOai3zTha__WVy2EsQUnt_Tlp0lgfvamBtQzBfYFfqhW0yGfgw_VR3vibcS676T8Vn2TImJIYoeH-wQpkk3LRsVkyVikHwBfvCDbww"
};

export default function MarktLandingScreen() {
  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1 justify-between">
        <View className="px-4 pt-5">
          <Text className="text-[#181111] text-[22px] font-bold leading-tight tracking-[-0.015em] text-left pb-3">
            Markt
          </Text>
          <Text className="text-[#181111] text-[32px] font-bold leading-tight text-left pb-3 pt-6">
            Join the community
          </Text>
        </View>

        <View className="px-4 pb-6">
          <TouchableOpacity className="h-12 bg-[#e9242a] rounded-full justify-center items-center mb-3">
            <Text className="text-white text-base font-bold tracking-[0.015em]">
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="h-12 bg-[#f4f0f0] rounded-full justify-center items-center">
            <Text className="text-[#181111] text-base font-bold tracking-[0.015em]">
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
