/**
 * Wallet top-up — hosted Paystack checkout in a WebView.
 *
 * Mirrors app/checkout/payscreen/[id].tsx. On return we call the server's
 * verify endpoint rather than trusting the redirect: the client never decides
 * that money moved.
 */

import React, { useCallback, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { verifyWalletTopUp } from "../../services/sections/wallet";
import {
  isWalletReturnUrl,
  isWalletCallbackUrl,
  parseWalletDeepLink,
  topupIdFromCallbackUrl,
} from "../../utils/walletDeepLink";

export default function WalletTopUpScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { authorization_url, topup_id } = useLocalSearchParams<{
    authorization_url?: string;
    topup_id?: string;
  }>();

  const [verifying, setVerifying] = useState(false);
  const handledReturn = useRef(false);

  const finish = useCallback(
    async (status: "success" | "failed", topupId?: string) => {
      if (handledReturn.current) return;
      handledReturn.current = true;

      if (status !== "success") {
        show({
          variant: "error",
          title: "Top-up not completed",
          message: "No money has left your account.",
        });
        router.back();
        return;
      }

      setVerifying(true);
      try {
        const result = await verifyWalletTopUp(topupId ?? (topup_id as string));
        if (result.verified) {
          show({
            variant: "success",
            title: "Wallet funded",
            message: `${result.currency} ${result.amount.toLocaleString()} added to your wallet.`,
          });
        } else {
          // Paystack hasn't settled it yet. The webhook will finish the job,
          // so this is "pending", not "failed" — don't tell a user who paid
          // that their money vanished.
          show({
            variant: "info",
            title: "Top-up processing",
            message: "We're confirming your payment. Your balance will update shortly.",
          });
        }
      } catch {
        show({
          variant: "info",
          title: "Top-up processing",
          message: "We couldn't confirm it just yet. Pull to refresh in a moment.",
        });
      } finally {
        setVerifying(false);
        router.back();
      }
    },
    [router, show, topup_id]
  );

  const handleReturnUrl = useCallback(
    (url: string) => {
      if (!isWalletReturnUrl(url)) return false;

      // Stop at the backend's callback hop rather than letting the WebView try
      // to load it. That URL's host comes from the server's API_BASE_URL, and
      // when that is wrong the phone can't reach it -- the customer has already
      // paid (the webhook credits them either way) but they'd see
      // ERR_CONNECTION_REFUSED and think it failed. finish() verifies over the
      // API, which doesn't care what API_BASE_URL says.
      if (isWalletCallbackUrl(url)) {
        finish("success", topupIdFromCallbackUrl(url) ?? (topup_id as string));
        return true;
      }

      const parsed = parseWalletDeepLink(url);
      finish(parsed?.status ?? "failed", parsed?.topupId);
      return true;
    },
    [finish, topup_id]
  );

  if (verifying) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center bg-surface-raised`}
      >
        <ActivityIndicator size="large" color={isDark ? "#f0f1f2" : "#000000"} />
        <Text className={`mt-3 text-sm text-text-secondary`}>
          Confirming top-up…
        </Text>
      </SafeAreaView>
    );
  }

  if (!authorization_url) {
    return (
      <SafeAreaView
        className={`flex-1 items-center justify-center px-6 bg-surface-raised`}
      >
        <Text
          className={`text-center font-semibold text-text-primary`}
        >
          Payment link unavailable
        </Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 rounded bg-primary"
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-raised`}
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel top-up"
        >
          <ArrowLeft size={24} color={isDark ? "#f0f1f2" : "#000000"} />
        </TouchableOpacity>
        <Text
          className={`ml-3 text-base font-semibold text-text-primary`}
        >
          Fund wallet
        </Text>
      </View>
      <WebView
        source={{ uri: authorization_url }}
        className="flex-1 bg-surface-page"
        onNavigationStateChange={(navState: WebViewNavigation) =>
          handleReturnUrl(navState.url)
        }
        onShouldStartLoadWithRequest={(req) => !handleReturnUrl(req.url)}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
