/**
 * Paying for a Markt Business plan — Paystack's hosted checkout in a WebView.
 *
 * Mirrors app/wallet/topup.tsx: we stop at the backend's callback hop
 * instead of loading it, then ask the server to verify. The client never
 * decides that money moved.
 */
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { useToast } from "../../components/ToastProvider";
import { useBusiness } from "../../hooks/businessContext";
import { verifySubscription } from "../../services/sections/business";

/** The backend's redirect after Paystack, or the app deep link it points on to. */
function isReturnUrl(url: string): boolean {
  return url.includes("/business/subscriptions/callback/") || url.startsWith("markt://business/subscription");
}

export default function SubscriptionPayScreen() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const { refreshMyBusiness } = useBusiness();
  const { authorization_url, subscription_id } = useLocalSearchParams<{ authorization_url?: string; subscription_id?: string }>();
  const [verifying, setVerifying] = useState(false);
  const handled = useRef(false);

  const finish = useCallback(async () => {
    if (handled.current) return;
    handled.current = true;
    setVerifying(true);
    try {
      const result = await verifySubscription(Number(subscription_id));
      if (result.verified) {
        await refreshMyBusiness();
        show({ variant: "success", title: "You're subscribed", message: "Your plan is active." });
      } else if (result.status === "EXPIRED") {
        show({ variant: "error", title: "Payment not completed", message: "Nothing was charged. You can try again." });
      } else {
        // Paystack hasn't settled it yet; the webhook will finish the job.
        // Don't tell someone who paid that it failed.
        show({ variant: "info", title: "Confirming payment", message: "This usually takes a minute. Your plan will update shortly." });
      }
    } catch {
      show({ variant: "info", title: "Confirming payment", message: "We couldn't confirm it just yet. Check back in a moment." });
    } finally {
      setVerifying(false);
      router.back();
    }
  }, [subscription_id]);

  const intercept = (url: string) => {
    if (!isReturnUrl(url)) return false;
    void finish();
    return true;
  };

  if (verifying) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color={t.textPrimary} />
        <Text className="mt-3 text-sm text-text-secondary">Confirming payment…</Text>
      </SafeAreaView>
    );
  }

  if (!authorization_url || !subscription_id) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6 bg-surface-page">
        <Text className="text-center font-semibold text-text-primary">Payment link unavailable</Text>
        <TouchableOpacity className="mt-4 px-6 py-3 rounded bg-primary-fill" onPress={() => router.back()} accessibilityRole="button">
          <Text className="font-semibold text-text-on-primary">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel payment">
          <ArrowLeft size={24} color={t.textPrimary} />
        </TouchableOpacity>
        <Text className="ml-3 text-base font-semibold text-text-primary">Pay for your plan</Text>
      </View>
      <WebView
        source={{ uri: authorization_url }}
        className="flex-1 bg-surface-page"
        onNavigationStateChange={(nav: WebViewNavigation) => intercept(nav.url)}
        onShouldStartLoadWithRequest={(req) => !intercept(req.url)}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={t.textPrimary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
