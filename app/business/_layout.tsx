/**
 * Markt Business — the business experience inside the same app and account.
 *
 * A stack around its own tab bar, so detail screens (a listing, a business, a
 * form) open full-screen over the tabs the way the consumer side does. If the
 * backend switches business mode off, everything here falls back to everyday
 * Markt.
 */
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useBusiness } from "../../hooks/businessContext";
import { useTokens } from "../../theme/useTokens";

export default function BusinessLayout() {
  const { config, setMode } = useBusiness();
  const router = useRouter();
  const t = useTokens();

  useEffect(() => {
    if (!config.features.enabled) {
      void setMode("consumer");
      router.replace("/(tabs)");
    }
  }, [config.features.enabled]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surfacePage } }}>
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
