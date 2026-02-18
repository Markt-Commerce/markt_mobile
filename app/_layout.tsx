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
//import * as SecureStore from 'expo-secure-store';
import React from "react";

export default function RootLayout() {
  // Temporary regData state until you move this into entrances/_layout.tsx
  const [regData, setRegData] = useState<RegisterRequest>({
    email: "",
    password: "",
    username: "",
    account_type: "buyer",
    phone_number: "",
    buyer_data: {} as RegisterRequest["buyer_data"],
    seller_data: {} as RegisterRequest["seller_data"],
  });


  // Persist user session on app load
  // Firstly, check if there is a stored user information in SecureStore
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

  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#e26136" />
        <Text style={{ marginTop: 12, color: "#876d64", fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return <Stack key="guest" screenOptions={{ headerShown: false }} initialRouteName="introduction" />;
  }

  return <Stack key="auth" screenOptions={{ headerShown: false }} />;
}
