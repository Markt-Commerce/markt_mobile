/**
 * Where money owed back should land.
 *
 * Today that means one thing: when a delivery is shared with other orders
 * going the same way, it costs less than the solo fee you were charged, and
 * the difference comes back to you.
 *
 * Both options are presented with what is actually different about them,
 * including the part that is worse. The card is the default and stays the
 * default — wallet credit is cheaper for Markt, which is exactly why it has
 * to be chosen rather than arranged.
 */
import React, { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CreditCard, Wallet, Check } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { useTokens } from "../../theme/useTokens";
import { useToast } from "../../components/ToastProvider";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import { getUserProfile, updateBuyerProfile } from "../../services/sections/profile";
import type { RefundPreference } from "../../models/profile";

interface Option {
  id: RefundPreference;
  icon: React.ElementType;
  title: string;
  tagline: string;
  /** What is genuinely better about this. */
  good: string[];
  /** And what is not. Stated, not buried — an option whose downside you only
   *  find out later is not a choice you were given. */
  bad: string[];
}

const OPTIONS: Option[] = [
  {
    id: "card",
    icon: CreditCard,
    title: "Back to my card",
    tagline: "Default",
    good: [
      "The money leaves Markt and returns to the card that paid",
      "Nothing to remember and nothing to withdraw",
    ],
    bad: ["Your bank can take a few days to show it"],
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Into my Markt wallet",
    tagline: "Instant",
    good: [
      "Lands straight away, not in a few days",
      "Spend it on your next order, or withdraw it to your bank — any amount, no minimum when you take out the whole balance",
    ],
    bad: [
      "Markt holds it until you move it",
      "Withdrawing to your bank is a separate step you have to take",
    ],
  },
];

export default function RefundPreferenceScreen() {
  const t = useTokens();
  const router = useRouter();
  const { show } = useToast();
  const [choice, setChoice] = useState<RefundPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<RefundPreference | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = await getUserProfile();
        if (alive) {
          setChoice(profile?.buyer_account?.refund_preference ?? "card");
        }
      } catch {
        // Showing the default rather than an error: this screen is still
        // usable, and choosing writes the value regardless of what we read.
        if (alive) setChoice("card");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const pick = async (next: RefundPreference) => {
    if (saving || next === choice) return;
    const previous = choice;
    setChoice(next); // Optimistic: the tap should feel like it did something.
    setSaving(next);
    try {
      await updateBuyerProfile({ refund_preference: next });
      show({
        variant: "success",
        title: "Saved",
        message:
          next === "wallet"
            ? "Money owed back will land in your wallet."
            : "Money owed back will return to your card.",
      });
    } catch (e) {
      setChoice(previous);
      show({
        variant: "error",
        title: "Couldn't save that",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page">
      <ScreenHeader title="Refunds" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-5">
          <Text className="text-[14px] leading-6 text-text-secondary">
            When your delivery is shared with other orders going the same way,
            it costs less than the fee you were charged. Choose where that
            difference goes.
          </Text>

          {loading ? (
            <View className="mt-10 items-center">
              <ActivityIndicator size="small" color={t.textPrimary} />
            </View>
          ) : (
            <View className="mt-5">
              {OPTIONS.map((option) => {
                const selected = choice === option.id;
                const busy = saving === option.id;
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => pick(option.id)}
                    disabled={!!saving}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: !!saving }}
                    accessibilityLabel={`${option.title}. ${option.good.join(". ")}. ${option.bad.join(". ")}`}
                    className={`mb-3 rounded-2xl border p-4 ${
                      selected
                        ? "border-primary-fill bg-surface-raised"
                        : "border-border bg-surface-raised"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Icon
                        size={20}
                        color={selected ? t.primaryText : t.textSecondary}
                        strokeWidth={1.8}
                      />
                      <Text className="ml-3 flex-1 text-[16px] font-bold text-text-primary">
                        {option.title}
                      </Text>
                      <Text className="mr-3 text-[12px] text-text-muted">
                        {option.tagline}
                      </Text>
                      {busy ? (
                        <ActivityIndicator size="small" color={t.textSecondary} />
                      ) : (
                        <View
                          className={`h-6 w-6 items-center justify-center rounded-full border ${
                            selected
                              ? "border-primary-fill bg-primary-fill"
                              : "border-border"
                          }`}
                        >
                          {selected ? (
                            <Check size={14} color={t.textOnPrimary} />
                          ) : null}
                        </View>
                      )}
                    </View>

                    <View className="mt-3">
                      {option.good.map((line) => (
                        <Text
                          key={line}
                          className="mb-1 text-[13px] leading-5 text-text-secondary"
                        >
                          • {line}
                        </Text>
                      ))}
                      {option.bad.map((line) => (
                        <Text
                          key={line}
                          className="mb-1 text-[13px] leading-5 text-text-muted"
                        >
                          • {line}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text className="mt-2 text-[12px] leading-5 text-text-muted">
            You can change this whenever you like. It only applies to money
            owed back to you — it never changes how you pay.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
