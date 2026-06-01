// app/_layout.tsx
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { UserProvider, useUser } from "../hooks/userContextProvider";
import { RegisterProvider } from "../models/signupSteps";
import { ToastProvider } from "../components/ToastProvider";
import { ThemeProvider } from "../components/themeProvider";
import { useTheme } from "../components/themeProvider";
import { useState } from "react";
import { RegisterRequest } from "../models/auth";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";

export default function RootLayout() {
  const [regData, setRegData] = useState<RegisterRequest>({
    email: "",
    password: "",
    username: "",
    account_type: "buyer",
    phone_number: "",
    buyer_data: {} as RegisterRequest["buyer_data"],
    seller_data: {} as RegisterRequest["seller_data"],
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <UserProvider>
              <RegisterProvider value={{ regData, setRegData }}>
                <AppStack />
              </RegisterProvider>
            </UserProvider>
          </GestureHandlerRootView>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export function AppStack() {
  const { user, isRestoringSession } = useUser();
  const { resolvedTheme } = useTheme();
  const isLoggedIn = !!user;
  const isDark = resolvedTheme === "dark";

  if (isRestoringSession) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? "bg-inverse-surface" : "bg-white"}`}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
        <Text className={`mt-3 text-sm ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>Loading…</Text>
      </View>
    );
  }

  // Single stack + Stack.Protected: when logged in, guest routes are removed from
  // navigation history (fixes iOS swipe-back landing on introduction after login).
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? "#1a1c1d" : "#ffffff" } }}>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="introduction" />
          <Stack.Screen name="(entrances)" />
        </Stack.Protected>

        <Stack.Screen name="support" />
      </Stack>
    </>
  );
}
