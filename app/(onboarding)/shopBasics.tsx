import React, { useState } from "react";
import { Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTokens } from "../../theme/useTokens";
import { SuccessMark } from "../../components/illustrations/MarktIllustration";

/**
 * The two things a shop cannot open without.
 *
 * The old seller path asked for shop name, username, phone and a description
 * on one screen, then a full address on the next — five fields and an address
 * before the seller had listed anything. Username now comes from the name
 * screen, phone is asked when a buyer first needs to reach them, and the
 * description is prompted from the shop page where it is actually visible.
 *
 * What remains is the shop's name and what it sells. Everything else is a
 * "finish your shop" nudge on the dashboard, where it has context.
 */
export default function ShopBasics() {
  const router = useRouter();
  const t = useTokens();
  const [shopName, setShopName] = useState("");
  const valid = shopName.trim().length >= 2;

  const finish = () => {
    // replace, so the onboarding stack is gone for good.
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <SuccessMark size={92} />
          </View>
          <Text className="text-[28px] font-bold leading-9 text-center text-text-primary">
            Name your shop
          </Text>
          <Text className="text-base mt-2 text-center text-text-secondary">
            This is what buyers see. You can change it later.
          </Text>

          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. Tech Haven"
            placeholderTextColor={t.textMuted}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => valid && finish()}
            accessibilityLabel="Shop name"
            className="h-14 mt-8 px-4 rounded border border-border-strong bg-surface-sunken text-[17px] text-text-primary"
          />

          <Text className="text-[13px] mt-4 leading-5 text-text-muted">
            You'll add your first product, categories and payout details from
            your dashboard — no need to do it all now.
          </Text>
        </ScrollView>

        <View className="px-6 pb-6 gap-3">
          <Pressable
            onPress={finish}
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
              Open my shop
            </Text>
          </Pressable>

          {/* No dead end: a seller who isn't ready to name a shop yet can still
              get into the app rather than being stuck on a required field. */}
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            className="h-11 items-center justify-center"
            hitSlop={8}
          >
            <Text className="text-[15px] font-semibold text-text-secondary">
              I'll do this later
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
