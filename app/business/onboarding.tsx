/**
 * Business onboarding: introduction, buy/sell choice, business type and
 * profile — then straight into business mode.
 */
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Building2 } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import BusinessProfileForm from "../../components/business/ProfileForm";
import { useBusiness } from "../../hooks/businessContext";
import { useTokens } from "../../theme/useTokens";

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const t = useTokens();
  const { config, myBusiness, setMode } = useBusiness();
  // Someone who turned business off keeps their profile; coming back here
  // turns the tag on again with it pre-filled.
  const returning = !!myBusiness?.profile;

  const leave = async () => {
    await setMode("consumer");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Markt Business" onBack={leave} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="px-4 pt-6 pb-6">
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-primary-muted mb-4">
              <Building2 size={24} color={t.primaryText} strokeWidth={2} />
            </View>
            <Text className="text-[26px] font-bold tracking-tight text-text-primary">
              {returning ? "Welcome back" : "Set up your business"}
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-text-secondary">
              Find suppliers, list what you produce and coordinate deals with other businesses — using the account you
              already have. Your everyday Markt shopping stays exactly as it is, and you can switch back any time.
            </Text>
          </View>

          {!config.features.registration_enabled ? (
            <View className="mx-4 p-4 rounded-2xl bg-surface-sunken">
              <Text className="text-sm text-text-secondary">New business sign-ups are paused at the moment. Please check back soon.</Text>
            </View>
          ) : (
            <BusinessProfileForm
              // Re-initialise once a saved profile arrives, so a returning
              // business sees its details rather than an empty form.
              key={myBusiness?.profile ? "returning" : "new"}
              profile={myBusiness?.profile ?? null}
              onboarding
              onSaved={async () => {
                await setMode("business");
                router.replace("/business");
              }}
            />
          )}

          <Text className="mx-4 mt-5 text-xs leading-5 text-text-muted">
            Registering doesn't make your business verified — that's a separate review by the Markt team.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
