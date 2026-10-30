/**
 * Plans and your current plan. Exists only while the backend has
 * subscriptions switched on; with them off this screen sends you back and
 * nothing links here.
 *
 * "Choose" starts a Paystack checkout (app/business/subscription-pay.tsx).
 * If Paystack ever finishes in an outside browser, the backend's callback
 * deep-links back here with ?subscription_id=…, and this screen verifies it.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Button from "../../components/button";
import { Badge, Card, EmptyState, Loading } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useTokens } from "../../theme/useTokens";
import { getMySubscription, listSubscriptionPlans, startSubscriptionCheckout, verifySubscription } from "../../services/sections/business";
import { useToast } from "../../components/ToastProvider";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import { formatNaira } from "../../utils/formatCurrency";
import type { MySubscription, SubscriptionPlan } from "../../models/business";

export default function BusinessSubscriptionScreen() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const { config, refreshMyBusiness } = useBusiness();
  const { subscription_id: returnedId } = useLocalSearchParams<{ subscription_id?: string }>();
  const enabled = config.features.subscriptions_enabled;
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [current, setCurrent] = useState<MySubscription | null>(null);
  const [starting, setStarting] = useState<number | null>(null);

  const load = useCallback(() => {
    listSubscriptionPlans().then(setPlans).catch(() => setPlans([]));
    getMySubscription().then(setCurrent).catch(() => setCurrent(null));
  }, []);

  useEffect(() => {
    if (!enabled) router.back();
  }, [enabled]);

  // Fresh on every visit, including coming back from the payment screen.
  useFocusEffect(
    useCallback(() => {
      if (enabled) load();
    }, [enabled, load])
  );

  // Arrived from the backend's callback deep link: confirm, don't trust it.
  useEffect(() => {
    if (!enabled || !returnedId) return;
    verifySubscription(Number(returnedId))
      .then(async (r) => {
        if (r.verified) {
          await refreshMyBusiness();
          show({ variant: "success", title: "You're subscribed", message: "Your plan is active." });
        } else if (r.status === "EXPIRED") {
          show({ variant: "error", title: "Payment not completed", message: "Nothing was charged." });
        }
        load();
      })
      .catch(() => {});
  }, [enabled, returnedId]);

  const choose = async (plan: SubscriptionPlan) => {
    setStarting(plan.id);
    try {
      const checkout = await startSubscriptionCheckout(plan.id);
      if (checkout.authorization_url) {
        router.push({
          pathname: "/business/subscription-pay",
          params: { authorization_url: checkout.authorization_url, subscription_id: String(checkout.subscription_id) },
        });
      } else {
        // A free plan is active straight away.
        await refreshMyBusiness();
        show({ variant: "success", title: `You're on ${plan.name}` });
        load();
      }
    } catch (e) {
      show({ variant: "error", title: "Couldn't start the payment", message: friendlyErrorMessage(e) });
    } finally {
      setStarting(null);
    }
  };

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
              {current.end_date ? ` until ${new Date(current.end_date).toLocaleDateString("en-NG")}` : ""}. Plans run for one
              billing period and don't renew automatically.
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
                {/* Renewing is choosing the current plan again; the backend adds
                    the new period on top of the time already paid for. */}
                <View className="mt-4">
                  <Button
                    variant={isCurrent ? "outline" : "primary"}
                    text={isCurrent ? "Renew" : plan.price > 0 ? `Choose ${plan.name}` : `Switch to ${plan.name}`}
                    loading={starting === plan.id}
                    disabled={starting !== null}
                    onPress={() => choose(plan)}
                  />
                </View>
                {plan.price > 0 ? <Text className="mt-2 text-center text-xs text-text-muted">Paid securely with Paystack</Text> : null}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
