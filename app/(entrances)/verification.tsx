import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../components/themeProvider";

export default function VerificationScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#f0f1f2" : "#000000";

    return (
      <SafeAreaView className={`flex-1 justify-center items-center px-4 ${isDark ? "bg-surface-sunken" : "bg-white"}`}>
        <View className="w-full max-w-[480px]">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`h-10 w-10 items-center justify-center rounded border ${isDark ? "bg-surface-raised border-border-strong" : "bg-surface border-border"}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft color={iconColor} size={20} />
            </TouchableOpacity>
          </View>

          <Text className={`text-[22px] font-bold leading-tight text-center pb-3 text-text-primary`}>
            Verify Your Email
          </Text>
          <Text className={`text-sm font-normal text-center mb-6 text-text-secondary`}>
            A verification code has been sent to your email.
          </Text>

          <TextInput
            placeholder="Enter verification code"
            placeholderTextColor={isDark ? "#c6c5cf" : "#A1A1AA"}
            className={`form-input w-full rounded h-14 px-4 text-base font-normal mb-4 border ${isDark ? "text-text-primary bg-surface-raised border-border-strong" : "text-black bg-surface border-border"}`}
          />

          <TouchableOpacity
            className="w-full h-12 bg-primary rounded justify-center items-center"
            onPress={() => router.push("/login")}
          >
            <Text className="text-white text-base font-bold tracking-[0.015em]">
              Verify
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }