/**
 * Plans and your current plan. Exists only while the backend has
 * subscriptions switched on; with them off this screen sends you back and
 * nothing links here.
 */
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Crown } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Button from "../../components/button";
import { Badge, Card, EmptyState, Loading } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useTokens } from "../../theme/useTokens";
import { getMySubscription, listSubscriptionPlans } from "../../services/sections/business";
import { formatNaira } from "../../utils/formatCurrency";
import type { MySubscription, SubscriptionPlan } from "../../models/business";

export default function BusinessSubscriptionScreen() {
  const router = useRouter();
  const t = useTokens();
  const { config } = useBusiness();
  const enabled = config.features.subscriptions_enabled;
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [current, setCurrent] = useState<MySubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      router.back();
      return;
    }
    listSubscriptionPlans().then(setPlans).catch(() => setPlans([]));
    getMySubscription().then(setCurrent).catch(() => setCurrent(null));
  }, [enabled]);

  if (!enabled) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Subscription" fallback="/business/account" />
      {plans === null ? (
        <Loading />
      ) : plans.length === 0 ? (
        <EmptyState icon={Crown} title="Plans aren't available yet" message="Check back soon." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {current ? (
            <Text className="text-[14px] text-text-secondary">
              You're on <Text className="font-bold text-text-primary">{current.plan.name}</Text>
              {current.end_date ? ` until ${new Date(current.end_date).toLocaleDateString("en-NG")}` : ""}.
            </Text>
          ) : null}
          {plans.map((plan) => {
            const isCurrent = current?.plan.id === plan.id;
            return (
              <Card key={plan.id} className={isCurrent ? "border-primary" : ""}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[17px] font-bold text-text-primary">{plan.name}</Text>
                  {isCurrent ? <Badge label="Current" tone="brand" /> : null}
                </View>
                <Text className="mt-2 text-[26px] font-bold tracking-tight text-text-primary">
                  {plan.price > 0 ? formatNaira(plan.price) : "Free"}
                </Text>
                {plan.price > 0 ? <Text className="text-[12px] text-text-secondary">per {plan.billing_interval.replace(/ly$/, "")}</Text> : null}
                {plan.description ? <Text className="mt-2 text-[14px] leading-5 text-text-secondary">{plan.description}</Text> : null}
                {plan.features.map((f) => (
                  <View key={f.feature_key} className="flex-row items-center gap-2 mt-2">
                    <Check size={14} color={t.successText} strokeWidth={2.5} />
                    <Text className="text-[14px] text-text-primary">
                      {f.feature_key.replace(/_/g, " ")}
                      {f.limit_value != null ? ` (up to ${f.limit_value})` : ""}
                    </Text>
                  </View>
                ))}
                {!isCurrent ? (
                  <View className="mt-4">
                    {/* Online checkout for plans isn't built yet — the backend
                        only records a subscription from a confirmed payment —
                        so this hands off to the team instead of faking one. */}
                    <Button
                      text={`Choose ${plan.name}`}
                      onPress={() =>
                        Linking.openURL(`mailto:support@marktcommerce.com?subject=${encodeURIComponent(`Markt Business plan: ${plan.name}`)}`)
                      }
                    />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
