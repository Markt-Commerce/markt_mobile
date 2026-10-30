import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import BusinessProfileForm from "../../components/business/ProfileForm";
import { Loading } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useToast } from "../../components/ToastProvider";

export default function BusinessProfileEditScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { myBusiness } = useBusiness();

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Business profile" fallback="/business/account" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {myBusiness?.profile ? (
            <BusinessProfileForm
              profile={myBusiness.profile}
              onSaved={() => {
                show({ variant: "success", title: "Saved", message: "Your business profile is up to date." });
                router.back();
              }}
            />
          ) : (
            <Loading />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
