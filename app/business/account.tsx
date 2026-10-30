/**
 * Business settings: profile, verification, how the business trades,
 * products, subscription (only while subscriptions are on), and the way back
 * to everyday Markt.
 */
import React, { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRightLeft, BadgeCheck, Building2, Crown, ImagePlus, Package, PowerOff, Settings, ShoppingBag, Store, Trash2 } from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { SettingsSection as Section, SettingsRow as Row } from "../../components/SettingsList";
import { Badge, VerificationBadge } from "../../components/business/ui";
import { useBusiness } from "../../hooks/businessContext";
import { useUser } from "../../hooks/userContextProvider";
import { useToast } from "../../components/ToastProvider";
import { useTokens } from "../../theme/useTokens";
import { confirmDestructive } from "../../utils/confirm";
import {
  disableBusiness,
  getMySubscription,
  removeBusinessImage,
  requestBusinessVerification,
  uploadBusinessImage,
  type BusinessImageKind,
} from "../../services/sections/business";
import { pickImage } from "../../services/imageSelection";
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

  const status = business?.verification_status;
  const canRequestVerification =
    config.features.verification_enabled && (status === "UNVERIFIED" || status === "REJECTED");
  const [busy, setBusy] = useState<string | null>(null);

  const changeImage = async (kind: BusinessImageKind) => {
    const uri = await pickImage();
    if (!uri) return;
    setBusy(kind);
    try {
      await uploadBusinessImage(kind, uri);
      await refreshMyBusiness();
      show({ variant: "success", title: kind === "logo" ? "Logo updated" : "Cover updated" });
    } catch (e) {
      show({ variant: "error", title: "Couldn't upload the image", message: friendlyErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const removeImage = (kind: BusinessImageKind) =>
    confirmDestructive({
      title: kind === "logo" ? "Remove logo?" : "Remove cover image?",
      message: "You can upload a new one any time.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          await removeBusinessImage(kind);
          await refreshMyBusiness();
        } catch (e) {
          show({ variant: "error", title: "Couldn't remove it", message: friendlyErrorMessage(e) });
        }
      },
    });

  const askForVerification = async () => {
    setBusy("verify");
    try {
      await requestBusinessVerification();
      await refreshMyBusiness();
      show({ variant: "success", title: "Request sent", message: "The Markt team will review your business." });
    } catch (e) {
      show({ variant: "error", title: "Couldn't send the request", message: friendlyErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

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
          {business?.logo_url ? (
            <Image source={{ uri: business.logo_url }} className="w-16 h-16 rounded-2xl bg-surface-sunken" />
          ) : (
            <View className="w-16 h-16 rounded-2xl items-center justify-center bg-primary-muted">
              <Building2 size={28} strokeWidth={2} color={t.primaryText} />
            </View>
          )}
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

        <Section title="Logo and cover">
          <Row
            icon={ImagePlus}
            title={business?.logo_url ? "Change logo" : "Add a logo"}
            value={busy === "logo" ? "Uploading…" : undefined}
            onPress={() => busy === null && changeImage("logo")}
          />
          {business?.logo_url ? <Row icon={Trash2} title="Remove logo" destructive onPress={() => removeImage("logo")} /> : null}
          <Row
            icon={ImagePlus}
            title={business?.cover_image_url ? "Change cover image" : "Add a cover image"}
            value={busy === "cover" ? "Uploading…" : undefined}
            onPress={() => busy === null && changeImage("cover")}
            last={!business?.cover_image_url}
          />
          {business?.cover_image_url ? (
            <Row icon={Trash2} title="Remove cover image" destructive onPress={() => removeImage("cover")} last />
          ) : null}
        </Section>

        <Section title="Verification">
          <View className="px-4 py-4">
            <Text className="text-[13px] leading-5 text-text-secondary">
              Verification is a review by the Markt team and is separate from registration.
              {status === "PENDING" ? " Your request is with the team." : ""}
              {status === "REJECTED" ? " Your last request wasn't approved — update your details and ask again." : ""}
            </Text>
          </View>
          {/* Only while the backend has the review queue open. */}
          {canRequestVerification ? (
            <Row
              icon={BadgeCheck}
              title="Request verification"
              value={busy === "verify" ? "Sending…" : undefined}
              onPress={() => busy === null && askForVerification()}
              last
            />
          ) : null}
        </Section>

        <Section title="Mode">
          <Row icon={ArrowRightLeft} title="Switch to everyday Markt" onPress={switchToMarkt} />
          <Row icon={PowerOff} title="Turn off Markt Business" destructive onPress={turnOff} last />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
