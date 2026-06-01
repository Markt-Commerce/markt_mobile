import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Briefcase,
  CircleUserRound,
  LayoutGrid,
  Settings,
  ShieldCheck,
} from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import Avatar from "../../components/Avatar";
import CreateRoleBottomSheet from "../../components/createRoleBottomSheet";
import { useUser } from "../../hooks/userContextProvider";
import { useToast } from "../../components/ToastProvider";
import { getUserProfile } from "../../services/sections/profile";
import { switchUserRole } from "../../services/sections/auth";
import type { UserProfile } from "../../models/profile";
import { useTheme } from "../../components/themeProvider";

function Section({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View className="px-6 mt-8">
      <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
        {title}
      </Text>
      <View className={`border rounded overflow-hidden ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon: Icon,
  title,
  subtitle,
  onPress,
  last = false,
  isDark,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-row items-center justify-between px-4 py-4 ${last ? "" : isDark ? "border-b border-[#46464e]" : "border-b border-border"}`}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        <View className={`w-10 h-10 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
          <Icon size={18} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.7} />
        </View>
        <View className="flex-1">
          <Text className={`font-geist font-bold text-[15px] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{title}</Text>
          <Text className={`font-inter text-[13px] mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{subtitle}</Text>
        </View>
      </View>
      <ArrowRight size={18} color={isDark ? "#c6c5cf" : "#71717A"} strokeWidth={1.7} />
    </TouchableOpacity>
  );
}

function StatPill({ label, active, isDark }: { label: string; active: boolean; isDark: boolean }) {
  return (
    <View className={`px-3 py-2 rounded border ${active ? (isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border") : (isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border")}`}>
      <Text className={`font-geist font-bold text-[10px] tracking-[2px] uppercase ${active ? (isDark ? "text-[#f0f1f2]" : "text-black") : (isDark ? "text-[#c6c5cf]" : "text-tertiary")}`}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { role, setRole } = useUser();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createMode, setCreateMode] = useState<"buyer" | "seller" | null>(null);
  const createRoleRef = useRef<BottomSheet | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

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
    try {
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
      setCreateMode(role === "buyer" ? "seller" : "buyer");
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
    getUserProfile().then(setProfile).catch(() => setProfile(null));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#1a1c1d" : "white" }} edges={["left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "bg-[#1a1c1d]" : "bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-8">
          <Text className={`font-geist font-bold text-[28px] tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
            Profile
          </Text>
          <Text className={`font-inter text-base mt-2 leading-6 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            Manage your identity, understand your active role, and jump into account tasks.
          </Text>
        </View>

        <View className="px-6 pt-8">
          <View className={`border rounded px-5 py-5 ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
            <View className="flex-row items-center gap-4">
              <Avatar
                uri={profile?.profile_picture_url}
                name={displayName}
                size={64}
                className="rounded"
              />
              <View className="flex-1">
                <Text className={`font-geist font-bold text-[24px] tracking-tight ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text className={`font-inter text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`} numberOfLines={1}>
                  @{profile?.username ?? "user"}
                </Text>
                <Text className={`font-geist font-bold text-[10px] tracking-[2px] uppercase mt-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {role} account active
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mt-4">
              <StatPill label="Buyer" active={role === "buyer"} isDark={isDark} />
              <StatPill label="Seller" active={role === "seller"} isDark={isDark} />
            </View>

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => router.push("/(settings)/accountInfoScreen")}
                activeOpacity={0.85}
                className="flex-1 h-12 rounded bg-primary items-center justify-center"
              >
                <Text className="text-white font-geist font-bold text-[11px] tracking-[2px] uppercase">
                  Edit Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSwitchRole}
                activeOpacity={0.85}
                className={`flex-1 h-12 rounded border items-center justify-center ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}
              >
                <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {dualRole ? `Switch to ${role === "buyer" ? "Seller" : "Buyer"}` : `Create ${role === "buyer" ? "Seller" : "Buyer"}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Section title="Role Overview" isDark={isDark}>
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
            isDark={isDark}
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
            isDark={isDark}
          />
        </Section>

        <Section title="Account Navigation" isDark={isDark}>
          <Row
            icon={Settings}
            title="Settings"
            subtitle="Appearance, notifications, security, and support controls."
            onPress={() => router.push("/(settings)/settingsProfileScreen")}
            isDark={isDark}
          />
          <Row
            icon={LayoutGrid}
            title="My Niches"
            subtitle="Review the communities you run or participate in."
            onPress={() => router.push("/myniches" as any)}
            isDark={isDark}
          />
          <Row
            icon={ShieldCheck}
            title="Help & Policies"
            subtitle="Read support guidance, privacy information, and platform details."
            onPress={() => router.push("/support/help" as any)}
            last
            isDark={isDark}
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
