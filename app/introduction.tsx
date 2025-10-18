import React from "react";
import { ImageBackground, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function MarktLandingScreen() {
  const router = useRouter();

  // Fake starter progress (feel free to wire to real data)
  const level = 1;
  const xp = 20;       // out of 100 for demo
  const xpPercent = Math.min(100, Math.max(0, xp));

  return (
    <ImageBackground
      source={require("../assets/introimage.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      {/* dim overlay for readability */}
      <View className="absolute inset-0 bg-black/55" />

      <SafeAreaView className="flex-1 justify-between">
        {/* Top bar */}
        <View className="px-4 pt-4 flex-row items-center justify-between">
          <Text className="text-white text-[22px] font-extrabold tracking-[-0.015em]">Markt</Text>

          {/* Gamified chip */}
          <View className="flex-row items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
            <Text className="text-white text-xs">Lvl {level}</Text>
            <Text className="text-white/80 text-xs">•</Text>
            <Text className="text-white text-xs">{xp} XP</Text>
          </View>
        </View>

        {/* Middle “quest card” */}
        <View className="px-4">
          <View className="rounded-3xl bg-white/10 border border-white/20 p-5">
            <Text className="text-white text-[28px] font-extrabold leading-tight">
              Ready for your first quest?
            </Text>
            <Text className="text-white/90 mt-2">
              Explore a vibrant marketplace, complete mini-goals, and collect rewards as you buy & sell.
            </Text>

            {/* Progress */}
            <View className="mt-4">
              <View className="flex-row items-end justify-between">
                <Text className="text-white/80 text-xs">Starter Track</Text>
                <Text className="text-white text-xs font-semibold">{xpPercent}%</Text>
              </View>
              <View className="w-full h-2 bg-white/15 rounded-full mt-2 overflow-hidden">
                <View
                  className="h-2 bg-white rounded-full"
                  style={{ width: `${xpPercent}%` }}
                />
              </View>
              {/* Mini “quests” */}
              <View className="mt-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white">🧭</Text>
                  <Text className="text-white/90">Discover trending niches</Text>
                </View>
                <View className="flex-row items-center gap-2 mt-1.5">
                  <Text className="text-white">🛍️</Text>
                  <Text className="text-white/90">Follow sellers you love</Text>
                </View>
                <View className="flex-row items-center gap-2 mt-1.5">
                  <Text className="text-white">💎</Text>
                  <Text className="text-white/90">Unlock perks as you level up</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            className="h-12 bg-[#e9242a] rounded-full justify-center items-center mb-3 active:opacity-90"
            onPress={() => router.navigate("/signup")}
          >
            <Text className="text-white text-base font-bold tracking-[0.015em]">
              Start your first quest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-12 bg-white/90 rounded-full justify-center items-center active:opacity-90"
            onPress={() => router.navigate("/login")}
          >
            <Text className="text-[#181111] text-base font-bold tracking-[0.015em]">
              I already have an account
            </Text>
          </TouchableOpacity>

          {/* Tiny footer tip */}
          <View className="items-center mt-3">
            <Text className="text-white/70 text-[12px]">
              Tip: Complete your profile to unlock a bonus
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
