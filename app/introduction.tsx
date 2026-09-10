import React, { useCallback } from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";
import { useSocialAuth, useAppleAuthAvailable } from "../hooks/useSocialAuth";
import { useTokens } from "../theme/useTokens";
import { useUser } from "../hooks/userContextProvider";

/**
 * The first screen. Replaces `introduction` as the logged-out entry point.
 *
 * Three decisions worth naming:
 *
 * 1. **Social first.** Apple and Google sit above email, because they are one
 *    tap against six screens. Email is still there and still obvious — it is
 *    secondary, not hidden.
 * 2. **"Browse first" is a real link, not a tease.** It opens the actual
 *    product catalogue (those endpoints are public), so someone can see what
 *    Markt sells before deciding whether to join. The old flow demanded a
 *    six-screen signup before showing a single price.
 * 3. **Sign in is a distinct, visible affordance.** A returning user should
 *    never have to work out that "get started" is also the way back in.
 */
export default function Welcome() {
  const router = useRouter();
  const t = useTokens();
  const { setUser, setRole } = useUser();
  const appleAvailable = useAppleAuthAvailable();

  const onSuccess = useCallback(
    (user: any, isNew: boolean) => {
      // Same shape the password path writes, so nothing downstream can tell
      // the two apart.
      const accountType = (user?.current_role ?? user?.account_type ?? "buyer") as
        | "buyer"
        | "seller";
      setUser({
        email: String(user?.email ?? "").toLowerCase(),
        account_type: accountType,
        user_id: user?.id,
      });
      setRole(accountType);

      // A returning user goes straight in. A new one still needs a name and a
      // role — two taps, not six screens.
      if (isNew) router.replace("/(onboarding)/yourName");
    },
    [router, setUser, setRole]
  );

  const {
    busy,
    error,
    needsPasswordLink,
    signInWithGoogle,
    signInWithApple,
    clearError,
  } = useSocialAuth(onSuccess);

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-16">
          <Text className="text-[34px] font-bold leading-[40px] text-text-primary">
            Buy and sell{"\n"}with people nearby.
          </Text>
          <Text className="text-base mt-3 leading-6 text-text-secondary">
            Markt is a marketplace built on real conversations — find what you
            need, or start selling in minutes.
          </Text>
        </View>

        <View className="px-6 pb-6">
          {error ? (
            <View
              className="rounded border border-danger/40 bg-danger-muted px-4 py-3 mb-4"
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Text className="text-sm text-danger-text">{error}</Text>
              {needsPasswordLink ? (
                <Pressable
                  onPress={() => {
                    clearError();
                    router.push("/(entrances)/login");
                  }}
                  accessibilityRole="button"
                  className="mt-2"
                  hitSlop={8}
                >
                  <Text className="text-sm font-bold text-danger-text underline">
                    Sign in with your password
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <SocialAuthButtons
            busy={busy}
            appleAvailable={appleAvailable}
            onGoogle={signInWithGoogle}
            onApple={signInWithApple}
          />

          <Pressable
            onPress={() => router.push("/(entrances)/signup")}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel="Continue with email"
            className="h-[52px] rounded mt-3 flex-row items-center justify-center border border-border active:opacity-80"
            style={{ opacity: busy ? 0.5 : 1 }}
          >
            <Text className="text-[16px] font-semibold text-text-primary">
              Continue with email
            </Text>
          </Pressable>

          {/* Value before friction: the catalogue is public, so this is a real
              door, not a preview. */}
          <Pressable
            onPress={() => router.push("/browse")}
            accessibilityRole="button"
            accessibilityLabel="Browse Markt without an account"
            className="h-11 flex-row items-center justify-center gap-1.5 mt-5"
            hitSlop={8}
          >
            <Text className="text-[15px] font-semibold text-text-secondary">
              Browse first
            </Text>
            <ArrowRight size={16} color={t.textSecondary} />
          </Pressable>

          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-sm text-text-secondary">
              Already have an account?{" "}
            </Text>
            <Pressable
              onPress={() => router.push("/(entrances)/login")}
              accessibilityRole="button"
              hitSlop={12}
            >
              <Text className="text-sm font-bold underline text-text-primary">
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
