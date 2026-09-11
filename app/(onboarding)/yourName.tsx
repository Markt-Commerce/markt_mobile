import React, { useState } from "react";
import { Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import StepDots from "../../components/auth/StepDots";
import { useTokens } from "../../theme/useTokens";
import { useUser } from "../../hooks/userContextProvider";

/**
 * One question, one field.
 *
 * The old flow asked for username, full name and phone on one screen, then an
 * address on the next. This asks the only thing needed to address someone by
 * name; the rest is collected where it is actually used (an address at
 * checkout, a phone when a seller needs to be reached).
 *
 * Prefilled when the provider gave us a name, which for most Google sign-ins
 * means the field is already correct and this is a single tap.
 */
export default function YourName() {
  const router = useRouter();
  const t = useTokens();
  const { profile } = useUser();

  const [name, setName] = useState(profile?.username ?? "");
  const trimmed = name.trim();
  const valid = trimmed.length >= 2;

  // `replace`, and the name travels as a param.
  //
  // Two bugs closed at once: this screen used to `push`, so a completed step
  // stayed on the stack, and it collected the name and then dropped it — the
  // value was never passed on or saved. It cannot be written to the server
  // here because which field it maps to (buyername vs shop name) depends on
  // the role, which is the *next* question.
  const next = () => {
    if (!valid) return;
    router.replace({
      pathname: "/(onboarding)/yourRole",
      params: { name: trimmed },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-6 pt-6">
          <StepDots total={2} current={1} className="mb-10" />

          <Text className="text-[28px] font-bold leading-9 text-text-primary">
            What should we call you?
          </Text>
          <Text className="text-base mt-2 text-text-secondary">
            This is the name buyers and sellers will see.
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Amaka Obi"
            placeholderTextColor={t.textMuted}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => valid && next()}
            accessibilityLabel="Your name"
            className="h-14 mt-8 px-4 rounded border border-border-strong bg-surface-sunken text-[17px] text-text-primary"
          />
          {name.length > 0 && !valid ? (
            <Text className="text-xs mt-2 text-danger-text" accessibilityLiveRegion="polite">
              That's a little short — two characters or more.
            </Text>
          ) : null}
        </View>

        <View className="px-6 pb-6">
          <Pressable
            onPress={next}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid }}
            className={`h-[52px] rounded items-center justify-center ${
              valid ? "bg-primary-fill" : "bg-surface-sunken"
            }`}
          >
            <Text
              className={`text-[16px] font-bold ${
                valid ? "text-text-on-primary" : "text-text-muted"
              }`}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
