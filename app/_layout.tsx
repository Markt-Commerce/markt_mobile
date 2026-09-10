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
import { useTokens } from "../theme/useTokens";
import { useTheme } from "../components/themeProvider";
import { useState } from "react";
import { RegisterRequest } from "../models/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentDeepLinkHandler from "../components/PaymentDeepLinkHandler";
import NotificationsBootstrap from "../components/NotificationsBootstrap";
import { GamificationProvider } from "../hooks/gamificationContext";
import { CelebrationProvider } from "../hooks/useCelebration";
import { BrowseLocationProvider } from "../hooks/browseLocationContext";
import CelebrationOverlay from "../components/gamification/CelebrationOverlay";
import { CartProvider } from "../hooks/cartContext";
import { NotificationsProvider } from "../hooks/notificationsContext";

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
                <NotificationsProvider>
                  <CartProvider>
                    <RegisterProvider value={{ regData, setRegData }}>
                      <AppStack />
                    </RegisterProvider>
                  </CartProvider>
                </NotificationsProvider>
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
  const t = useTokens();

  if (isRestoringSession) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface-page"
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator
          size="large"
          color={t.textPrimary}
        />
        <Text
          className="mt-3 text-sm text-text-secondary"
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
        contentStyle: { backgroundColor: t.surfacePage },
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack.Protected>

      {/* Profile completion sits OUTSIDE both guards on purpose.
          The account exists by the time these run, so they cannot live in the
          !isLoggedIn group — creating the account would unmount the very
          screens the user is standing on. Their own layout disables the back
          gesture, and each step uses `replace`, so a completed step cannot be
          returned to by swipe or by button. */}
      <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="introduction" />
        <Stack.Screen name="(entrances)" />
        {/* Value before friction: the product catalogue is public on the
            backend, so a guest can see what Markt actually sells before being
            asked to join. Everything that needs an identity — cart, chat,
            orders — stays behind the guard above. */}
        <Stack.Screen name="browse" />
      </Stack.Protected>

      <Stack.Screen name="support" />
      {/* Reachable either side of the auth guard: the browse location is a
          preference, and a guest choosing an area is the point. */}
      <Stack.Screen name="location/picker" options={{ presentation: "modal" }} />
    </Stack>
  );

  // GamificationProvider stays mounted regardless of auth state: its data
  // hooks no-op while logged out, and unmounting it on logout/401 would crash
  // any still-mounted consumer screen mid-transition ("useGamificationContext
  // must be used within a GamificationProvider").
  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {isLoggedIn && <PaymentDeepLinkHandler />}
      {/* CelebrationProvider wraps GamificationProvider because the latter
          queues into it. The overlay renders inside the provider and outside
          the stack, so a celebration survives navigation instead of being
          unmounted by the screen that triggered it. */}
      {/* Above the celebration layer because the feed and the header both read
          it, and a guest needs it before any auth decision is made. */}
      <BrowseLocationProvider>
      <CelebrationProvider>
        <GamificationProvider>{stack}</GamificationProvider>
        <CelebrationOverlay />
      </CelebrationProvider>
      </BrowseLocationProvider>
    </>
  );
}
