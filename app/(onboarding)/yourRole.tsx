import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingBag, Store, Check } from "lucide-react-native";
import StepDots from "../../components/auth/StepDots";
import { useTokens } from "../../theme/useTokens";
import { useUser } from "../../hooks/userContextProvider";
import { updateBuyerProfile } from "../../services/sections/profile";
import { logger } from "../../utils/logger";

/**
 * Buyer or seller — asked here, not on the signup form.
 *
 * The old flow put this as a segmented control above the email field, before
 * the user had seen anything, and silently forked the next three screens off
 * it. Asked here it is a real choice with a sentence of explanation, and
 * changing your mind later is a setting rather than a re-registration.
 *
 * Both options are equally weighted: nothing here nudges toward selling.
 */
const OPTIONS = [
  {
    id: "buyer" as const,
    Icon: ShoppingBag,
    title: "I'm here to buy",
    blurb: "Browse what's nearby, message sellers, and check out securely.",
  },
  {
    id: "seller" as const,
    Icon: Store,
    title: "I'm here to sell",
    blurb: "List what you have, reach local buyers, and get paid through Markt.",
  },
];

export default function YourRole() {
  const router = useRouter();
  const t = useTokens();
  const { setRole } = useUser();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [choice, setChoice] = useState<"buyer" | "seller" | null>(null);
  const [saving, setSaving] = useState(false);

  const done = async () => {
    if (!choice || saving) return;
    setSaving(true);
    setRole(choice);

    // Saved here rather than on the name screen, because only now do we know
    // the field it belongs in. Best-effort: a failed write must not strand
    // someone at the last step of signup — the name is editable in settings,
    // and blocking here would be worse than a missing display name.
    if (name?.trim() && choice === "buyer") {
      try {
        await updateBuyerProfile({ buyername: name.trim() });
      } catch (e) {
        logger.warn("onboarding: could not save display name", e);
      }
    }
    // `replace`, not `push`: finishing onboarding must not leave the flow in
    // history. The old emailVerification screen pushed, so an iOS swipe-back
    // landed the user right back inside signup.
    if (choice === "seller") {
      router.replace({
        pathname: "/(onboarding)/shopBasics",
        params: name ? { name } : {},
      });
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1 px-6 pt-6">
        <StepDots total={2} current={2} className="mb-10" />

        <Text className="text-[28px] font-bold leading-9 text-text-primary">
          How will you use Markt?
        </Text>
        <Text className="text-base mt-2 text-text-secondary">
          You can do both — this just sets up your home screen. Change it any
          time in settings.
        </Text>

        <View className="gap-3 mt-8">
          {OPTIONS.map(({ id, Icon, title, blurb }) => {
            const selected = choice === id;
            return (
              <Pressable
                key={id}
                onPress={() => setChoice(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${title}. ${blurb}`}
                className={`flex-row items-start gap-4 rounded-2xl border p-4 ${
                  selected
                    ? "border-primary bg-primary-muted"
                    : "border-border bg-surface-raised"
                }`}
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: selected ? t.primaryMuted : t.surfaceSunken }}
                >
                  <Icon
                    size={22}
                    color={selected ? t.primaryText : t.textSecondary}
                    strokeWidth={1.9}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-text-primary">{title}</Text>
                  <Text className="text-[13px] mt-1 leading-5 text-text-secondary">
                    {blurb}
                  </Text>
                </View>
                {selected ? (
                  <View className="w-6 h-6 rounded-full items-center justify-center bg-primary-fill mt-0.5">
                    <Check size={14} color={t.textOnPrimary} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6 pb-6">
        <Pressable
          onPress={done}
          disabled={!choice}
          accessibilityRole="button"
          accessibilityState={{ disabled: !choice }}
          className={`h-[52px] rounded items-center justify-center ${
            choice ? "bg-primary-fill" : "bg-surface-sunken"
          }`}
        >
          <Text
            className={`text-[16px] font-bold ${
              choice ? "text-text-on-primary" : "text-text-muted"
            }`}
          >
            {choice === "seller" ? "Set up my shop" : "Start browsing"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
