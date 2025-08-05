import React from "react";
import { ImageBackground, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";


export default function MarktLandingScreen() {

  const router = useRouter();
  return (
    <ImageBackground
      source={require("../assets/introimage.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1 justify-between">
        <View className="px-4 pt-5">
          <Text className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-left pb-3">
            Markt
          </Text>
        </View>

        <View className="px-4 pb-6">

        <View className="px-4 pb-5">
          <Text className="text-white text-[30px] font-bold leading-tight text-left pb-3 pt-6">
            Discover a vibrant marketplace where you can buy, sell, and connect with others.
          </Text>
        </View>

          <Text className="text-white text-[20px] font-bold leading-6 tracking-[0.015em] text-left pb-3">
            Join our community to explore unique products, engage with sellers, and find great deals.
          </Text>
          
          <TouchableOpacity className="h-12 bg-[#e9242a] rounded-full justify-center items-center mb-3" onPress={()=>router.navigate("/signup")}>
            <Text className="text-white text-base font-bold tracking-[0.015em]">
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="h-12 bg-[#f4f0f0] rounded-full justify-center items-center" onPress={()=>router.navigate("/login")}>
            <Text className="text-[#181111] text-base font-bold tracking-[0.015em]">
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
