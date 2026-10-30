/**
 * Business settings: profile, verification, how the business trades,
 * products, subscription (only while subscriptions are on), and the way back
 * to everyday Markt.
 */
import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRightLeft, Building2, Crown, Package, PowerOff, Settings, ShoppingBag, Store } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { SettingsSection as Section, SettingsRow as Row } from "../../components/SettingsList";
import { Badge, VerificationBadge } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useUser } from "../../hooks/userContextProvider";
import { useToast } from "../../components/ToastProvider";
import { useTokens } from "../../theme/useTokens";
import { confirmDestructive } from "../../utils/confirm";
import { disableBusiness, getMySubscription } from "../../services/sections/business";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import type { MySubscription } from "../../models/business";

export default function BusinessAccountScreen() {
  const router = useRouter();
  const t = useTokens();
  const { show } = useToast();
  const { profile } = useUser();
  const { config, myBusiness, setMode, refreshMyBusiness } = useBusiness();
  const subscriptionsOn = config.features.subscriptions_enabled;
  const [subscription, setSubscription] = useState<MySubscription | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshMyBusiness();
      if (subscriptionsOn) getMySubscription().then(setSubscription).catch(() => setSubscription(null));
    }, [subscriptionsOn])
  );

  const business = myBusiness?.profile;
  const isBuyer = !!profile?.is_buyer;
  const isSeller = !!profile?.is_seller;

  const switchToMarkt = async () => {
    await setMode("consumer");
    router.replace("/(tabs)");
  };

  const turnOff = () =>
    confirmDestructive({
      title: "Turn off Markt Business?",
      message: "Your business stops appearing in discovery. Your profile is kept, so you can turn it back on later.",
      confirmLabel: "Turn off",
      onConfirm: async () => {
        try {
          await disableBusiness();
          await refreshMyBusiness();
          await setMode("consumer");
          router.replace("/(tabs)");
        } catch (e) {
          show({ variant: "error", title: "Couldn't turn off", message: friendlyErrorMessage(e) });
        }
      },
    });

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["top", "bottom"]}>
      <ScreenHeader title="Business account" fallback="/business" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center px-6 pt-6 pb-6 bg-surface-raised">
          <View className="w-16 h-16 rounded-2xl items-center justify-center bg-primary-muted">
            <Building2 size={28} strokeWidth={2} color={t.primaryText} />
          </View>
          <Text className="mt-3 text-[22px] font-bold tracking-tight text-text-primary text-center" numberOfLines={2}>
            {business?.name ?? "Your business"}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2 mt-3">
            {business ? <VerificationBadge status={business.verification_status} /> : null}
            {isBuyer ? <Badge label="Buys" /> : null}
            {isSeller ? <Badge label="Sells" /> : null}
          </View>
        </View>

        <Section title="Business">
          <Row icon={Building2} title="Business profile" subtitle="Name, type, location and contact details" onPress={() => router.push("/business/profile-edit")} />
          {business ? (
            <Row
              icon={Store}
              title="View public profile"
              onPress={() => router.push(`/business/company/${business.user_id}`)}
            />
          ) : null}
          {isSeller ? (
            <Row icon={Package} title="Products" subtitle="Business terms on your listings" onPress={() => router.push("/business/products")} />
          ) : (
            <Row
              icon={Package}
              title="Start selling"
              subtitle="Add a seller account to list products"
              onPress={() => router.push("/(tabs)/profile")}
            />
          )}
          {!isBuyer ? (
            <Row icon={ShoppingBag} title="Start buying" subtitle="Add a buyer account to post procurement requests" onPress={() => router.push("/(tabs)/profile")} />
          ) : null}
          {/* Only while subscriptions are on — no empty row otherwise. */}
          {subscriptionsOn ? (
            <Row
              icon={Crown}
              title="Subscription"
              value={subscription?.plan.name}
              subtitle={subscription ? undefined : "See plans"}
              onPress={() => router.push("/business/subscription")}
            />
          ) : null}
          <Row icon={Settings} title="Account settings" onPress={() => router.push("/(settings)/settingsProfileScreen")} last />
        </Section>

        <Section title="Verification">
          <View className="px-4 py-4">
            <Text className="text-[13px] leading-5 text-text-secondary">
              Verification is a review by the Markt team and is separate from registration. To ask about it, contact
              support from Help & Policies.
            </Text>
          </View>
        </Section>

        <Section title="Mode">
          <Row icon={ArrowRightLeft} title="Switch to everyday Markt" onPress={switchToMarkt} />
          <Row icon={PowerOff} title="Turn off Markt Business" destructive onPress={turnOff} last />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
