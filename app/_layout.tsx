// app/_layout.tsx
import "react-native-reanimated";
import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import "../global.css";
import { UserProvider, useUser } from "../hooks/userContextProvider";
import { RegisterProvider } from "../models/signupSteps";
import { ToastProvider } from "../components/ToastProvider";
import { ThemeProvider } from "../components/themeProvider";
import { useTheme } from "../components/themeProvider";
import { useState } from "react";
import { RegisterRequest } from "../models/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentDeepLinkHandler from "../components/PaymentDeepLinkHandler";
import { GamificationProvider } from "../hooks/gamificationContext";

// Single app-wide query client. Created once at module scope so it survives
// re-renders and Fast Refresh. Powers the tanstack-query hooks (useAuth,
// useNotification, useProfileMutations).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <UserProvider>
                <NotificationsBootstrap />
                <RegisterProvider value={{ regData, setRegData }}>
                  <AppStack />
                </RegisterProvider>
              </UserProvider>
            </GestureHandlerRootView>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export function AppStack() {
  const { user, isRestoringSession } = useUser();
  const { resolvedTheme } = useTheme();
  const isLoggedIn = !!user;
  const isDark = resolvedTheme === "dark";

  if (isRestoringSession) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDark ? "bg-dark-page" : "bg-white"}`}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator
          size="large"
          color={isDark ? "#f5f5f5" : "#000000"}
        />
        <Text
          className={`mt-3 text-sm ${isDark ? "text-dark-muted" : "text-tertiary"}`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // Single stack + Stack.Protected: when logged in, guest routes are removed from
  // navigation history (fixes iOS swipe-back landing on introduction after login).
  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? "#0b0b0c" : "#ffffff" },
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="introduction" />
        <Stack.Screen name="(entrances)" />
      </Stack.Protected>

      <Stack.Screen name="support" />
    </Stack>
  );

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {isLoggedIn ? (
        <>
          <PaymentDeepLinkHandler />
          <GamificationProvider>{stack}</GamificationProvider>
        </>
      ) : (
        stack
      )}
    </>
  );
}
