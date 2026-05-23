// app/_layout.tsx
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import "../global.css";
import { UserProvider, useUser } from "../hooks/userContextProvider";
import { RegisterProvider } from "../models/signupSteps";
import { ToastProvider } from "../components/ToastProvider";
import { ThemeProvider} from "../components/themeProvider";
import { useState } from "react";
import { RegisterRequest } from "../models/auth";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
    <ThemeProvider>
    <ToastProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <RegisterProvider value={{ regData, setRegData }}>
          <AppStack />
        </RegisterProvider>
      </UserProvider>
    </GestureHandlerRootView>
    </ToastProvider>
    </ThemeProvider>
  );
}

export function AppStack() {
  const { user, isRestoringSession } = useUser();
  const isLoggedIn = !!user;

  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#e26136" />
        <Text style={{ marginTop: 12, color: "#876d64", fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  // Single stack + Stack.Protected: when logged in, guest routes are removed from
  // navigation history (fixes iOS swipe-back landing on introduction after login).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="introduction" />
        <Stack.Screen name="(entrances)" />
      </Stack.Protected>
    </Stack>
  );
}
