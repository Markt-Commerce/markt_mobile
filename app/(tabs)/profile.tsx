import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  ArrowRightLeft,
  Briefcase,
  CircleUserRound,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import Avatar from "../../components/Avatar";
import CreateRoleBottomSheet from "../../components/createRoleBottomSheet";
import { useUser } from "../../hooks/userContextProvider";
import { useToast } from "../../components/ToastProvider";
import { switchUserRole } from "../../services/sections/auth";
import { useTheme } from "../../components/themeProvider";
import {
  SettingsSection as Section,
  SettingsRow as Row,
} from "../../components/SettingsList";
import { useGamificationContext } from "../../hooks/gamificationContext";
import GamificationStrip from "../../components/gamification/GamificationStrip";

export default function ProfileScreen() {
  const router = useRouter();
  const { role, setRole, profile, setProfile, refreshProfile } = useUser();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [switchingRole, setSwitchingRole] = useState(false);
  const [createMode, setCreateMode] = useState<"buyer" | "seller" | null>(null);
  const createRoleRef = useRef<BottomSheet | null>(null);
  const { profile: gamification, badges: gamificationBadges } = useGamificationContext();

  useEffect(() => {
    if (createMode) {
      requestAnimationFrame(() => createRoleRef.current?.expand?.());
    }
  }, [createMode]);

  const displayName =
    role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "Shop";

  const hasBuyerAccount = profile?.is_buyer ?? false;
  const hasSellerAccount = profile?.is_seller ?? false;
  const dualRole = hasBuyerAccount && hasSellerAccount;

  const handleSwitchRole = async () => {
    // If the user doesn't have the other role yet, open the create sheet
    // directly instead of hitting the switch API (which would just fail).
    const targetRole = role === "buyer" ? "seller" : "buyer";
    const hasTargetAccount = targetRole === "buyer" ? hasBuyerAccount : hasSellerAccount;
    if (!hasTargetAccount) {
      setCreateMode(targetRole);
      return;
    }

    try {
      setSwitchingRole(true);
      const result = await switchUserRole();
      const nextRole = (result.user?.current_role ?? result.current_role) as "buyer" | "seller";
      setRole(nextRole);
      setProfile((current) =>
        current
          ? {
            ...current,
            current_role: nextRole,
          }
          : current
      );
      show({
        variant: "success",
        title: "Mode switched",
        message: `Now in ${nextRole} mode.`,
      });
    } catch {
      setCreateMode(targetRole);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleRoleRowPress = async (targetRole: "buyer" | "seller") => {
    const hasTargetAccount = targetRole === "buyer" ? hasBuyerAccount : hasSellerAccount;

    if (!hasTargetAccount) {
      setCreateMode(targetRole);
      return;
    }

    if (role === targetRole) {
      router.push("/(settings)/accountInfoScreen");
      return;
    }

    await handleSwitchRole();
  };

  const handleCreated = (newRole: "buyer" | "seller") => {
    setRole(newRole);
    setCreateMode(null);
    void refreshProfile();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={["left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "bg-surface-raised" : "bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Same identity treatment as Settings: centred, no card. It was a
            bordered box wrapping a bordered avatar and two stacked buttons, on
            a screen whose rows are now full-bleed. */}
        <View className={`items-center px-6 pt-6 pb-6 bg-surface-raised`}>
          <Avatar
            uri={profile?.profile_picture_url}
            name={displayName}
            size={88}
            className="rounded-full"
          />
          <Text
            className={`font-bold text-[22px] tracking-tight mt-3 text-text-primary`}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            className={`text-[14px] mt-0.5 text-text-muted`}
            numberOfLines={1}
          >
            @{profile?.username ?? "user"}
          </Text>

          <View className="flex-row flex-wrap justify-center gap-2 mt-4">
            <View className="px-3 py-1.5 rounded-full bg-primary">
              <Text className="font-bold text-[11px] uppercase tracking-wider text-white">
                {role}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2.5 mt-5 w-full">
            <TouchableOpacity
              onPress={() => router.push("/(settings)/accountInfoScreen")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              className={`flex-1 h-11 rounded-xl items-center justify-center bg-surface-sunken`}
            >
              <Text className={`font-semibold text-[14px] ${isDark ? "text-text-primary" : "text-[#3F3F46]"}`}>
                Edit profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSwitchRole}
              activeOpacity={0.85}
              disabled={switchingRole}
              accessibilityRole="button"
              accessibilityState={{ busy: switchingRole }}
              className={`flex-1 h-11 rounded-xl items-center justify-center flex-row ${
                isDark ? "bg-[#f0f1f2]" : "bg-black"
              } ${switchingRole ? "opacity-60" : ""}`}
            >
              <ArrowRightLeft size={15} color={isDark ? "#1a1c1d" : "#FFFFFF"} strokeWidth={2.2} />
              <Text
                className={`font-semibold text-[14px] ml-1.5 ${isDark ? "text-[#1a1c1d]" : "text-white"}`}
                numberOfLines={1}
              >
                {switchingRole
                  ? "Switching…"
                  : dualRole
                    ? `${role === "buyer" ? "Seller" : "Buyer"} mode`
                    : `Create ${role === "buyer" ? "seller" : "buyer"}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {gamification && (
          <View className="px-4 pb-2">
            <GamificationStrip
              profile={gamification}
              badges={gamificationBadges}
              onPress={() => router.push("/gamification" as any)}
              onBadgePress={(b) => router.push(`/gamification/badge/${b.slug}` as any)}
            />
          </View>
        )}

        <Section title="Role Overview" dark={isDark}>
          <Row
            icon={CircleUserRound}
            title="Buyer Identity"
            subtitle={
              hasBuyerAccount
                ? `Set up as ${profile?.buyer_account?.buyername ?? profile?.username ?? "buyer"}.`
                : "No buyer account created yet."
            }
            onPress={() => {
              void handleRoleRowPress("buyer");
            }}
            dark={isDark}
          />
          <Row
            icon={Briefcase}
            title="Seller Identity"
            subtitle={
              hasSellerAccount
                ? `Trading as ${profile?.seller_account?.shop_name ?? profile?.username ?? "seller"}.`
                : "No seller account created yet."
            }
            onPress={() => {
              void handleRoleRowPress("seller");
            }}
            last
            dark={isDark}
          />
        </Section>

        <Section title="Account Navigation" dark={isDark}>
          <Row
            icon={Trophy}
            title="Rewards & Badges"
            onPress={() => router.push("/gamification" as any)}
            dark={isDark}
          />
          <Row
            icon={Settings}
            title="Settings"
            onPress={() => router.push("/(settings)/settingsProfileScreen")}
            dark={isDark}
          />
          <Row
            icon={LayoutGrid}
            title="My Niches"
            onPress={() => router.push("/myniches" as any)}
            dark={isDark}
          />
          <Row
            icon={ShieldCheck}
            title="Help & Policies"
            onPress={() => router.push("/support/help" as any)}
            last
            dark={isDark}
          />
        </Section>
      </ScrollView>

      <CreateRoleBottomSheet
        ref={createRoleRef}
        mode={createMode}
        onClose={() => setCreateMode(null)}
        onCreated={handleCreated}
      />
    </SafeAreaView>
  );
}
