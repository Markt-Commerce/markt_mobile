import React, { useCallback } from "react";
import { ImageBackground, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Compass, ShoppingBag, Sparkles } from "lucide-react-native";
import { useUser } from "../hooks/userContextProvider";
import { navigateToAppHome } from "../utils/authNavigation";

export default function MarktLandingScreen() {
  const router = useRouter();
  const { user } = useUser();

  // Safety net if iOS swipe-back briefly surfaces this screen while authenticated.
  useFocusEffect(
    useCallback(() => {
      if (user) {
        navigateToAppHome();
      }
    }, [user])
  );

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
        <View className="px-6 pt-6 flex-row items-center justify-between">
          <Text className="text-white text-[24px] font-geist font-bold tracking-tight">Markt</Text>

          {/* Gamified chip */}
          <View className="flex-row items-center gap-2 bg-white/10 border border-white/20 rounded px-3 py-1">
            <Text className="text-white font-inter text-xs">Lvl {level}</Text>
            <Text className="text-white/80 text-xs">•</Text>
            <Text className="text-white font-inter text-xs">{xp} XP</Text>
          </View>
        </View>

        {/* Middle “quest card” */}
        <View className="px-6">
          <View className="rounded bg-white/10 border border-white/20 p-6">
            <Text className="text-white text-[32px] font-geist font-bold leading-tight">
              Ready for your first quest?
            </Text>
            <Text className="text-white/90 font-inter mt-3 leading-6">
              Explore a vibrant marketplace, complete mini-goals, and collect rewards as you buy & sell.
            </Text>

            {/* Progress */}
            <View className="mt-6">
              <View className="flex-row items-end justify-between">
                <Text className="text-white/80 font-inter text-xs">Starter Track</Text>
                <Text className="text-white font-geist text-xs font-semibold">{xpPercent}%</Text>
              </View>
              <View className="w-full h-1.5 bg-white/15 rounded mt-2 overflow-hidden">
                <View
                  className="h-1.5 bg-white rounded"
                  style={{ width: `${xpPercent}%` }}
                />
              </View>
                {/* Mini “quests” */}
                <View className="mt-4">
                  <View className="flex-row items-center gap-3">
                  <Compass size={16} color="#ffffff" />
                  <Text className="text-white/90 font-inter">Discover trending niches</Text>
                </View>
                <View className="flex-row items-center gap-3 mt-2">
                  <ShoppingBag size={16} color="#ffffff" />
                  <Text className="text-white/90 font-inter">Follow sellers you love</Text>
                </View>
                <View className="flex-row items-center gap-3 mt-2">
                  <Sparkles size={16} color="#ffffff" />
                  <Text className="text-white/90 font-inter">Unlock perks as you level up</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            className="h-12 bg-primary rounded justify-center items-center mb-4 active:opacity-90 shadow-sm"
            onPress={() => router.navigate("/signup")}
            accessibilityRole="button"
            accessibilityLabel="Start your first quest"
          >
            <Text className="text-white text-base font-geist font-semibold tracking-wide">
              Start your first quest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-12 bg-white rounded justify-center items-center active:opacity-90 shadow-sm"
            onPress={() => router.navigate("/login")}
            accessibilityRole="button"
            accessibilityLabel="I already have an account"
          >
            <Text className="text-black text-base font-geist font-semibold tracking-wide">
              I already have an account
            </Text>
          </TouchableOpacity>

          {/* Tiny footer tip */}
          <View className="items-center mt-4">
            <Text className="text-white/70 font-inter text-[12px]">
              Tip: Complete your profile to unlock a bonus
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
