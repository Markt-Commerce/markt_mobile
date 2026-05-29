import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Palette,
  ShieldCheck,
  UserCog,
} from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { useUser } from "../../hooks/userContextProvider";
import { useTheme } from "../../components/themeProvider";
import { getUserProfile } from "../../services/sections/profile";
import { logoutUser } from "../../services/sections/auth";
import { useToast } from "../../components/ToastProvider";
import { navigateToGuestHome } from "../../utils/authNavigation";
import type { UserProfile } from "../../models/profile";

const LANGUAGE_KEY = "app_lang_v1";

function SettingsSection({
  title,
  children,
  dark = false,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <View className="px-6 mt-8">
      <Text className={`font-geist font-bold text-[11px] tracking-[2px] uppercase mb-3 ${dark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
        {title}
      </Text>
      <View className={`rounded overflow-hidden border ${dark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onPress,
  last = false,
  dark = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  dark?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-row items-center justify-between px-4 py-4 ${last ? "" : dark ? "border-b border-[#46464e]" : "border-b border-border"}`}
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        <View className={`w-10 h-10 rounded items-center justify-center ${dark ? "bg-[#2f3132]" : "bg-surface"}`}>
          <Icon size={18} color={dark ? "#f0f1f2" : "#000000"} strokeWidth={1.7} />
        </View>
        <View className="flex-1">
          <Text className={`font-geist font-bold text-[15px] ${dark ? "text-[#f0f1f2]" : "text-black"}`}>{title}</Text>
          <Text className={`font-inter text-[13px] mt-1 ${dark ? "text-[#c6c5cf]" : "text-tertiary"}`}>{subtitle}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text className={`font-geist font-bold text-[11px] tracking-widest uppercase ${dark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
            {value}
          </Text>
        ) : null}
        <ArrowRight size={18} color={dark ? "#c6c5cf" : "#71717A"} strokeWidth={1.7} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { user, role, setUser } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();
  const [language, setLanguage] = useState("EN");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const displayName =
    role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "Shop";

  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => setProfile(null));
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored) setLanguage(stored.toUpperCase());
      })
      .catch(() => { });
  }, []);

  const handleThemeToggle = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    show({
      variant: "success",
      title: "Theme updated",
      message: `Switched to ${nextTheme} mode.`,
    });
  };

  const handleLanguageToggle = async () => {
    const nextLanguage = language === "EN" ? "FR" : "EN";
    setLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage.toLowerCase());
    show({
      variant: "success",
      title: "Language updated",
      message: `Preference set to ${nextLanguage}.`,
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      show({ variant: "info", title: "Logged out", message: "You've been signed out." });
      navigateToGuestHome();
    } catch {
      show({ variant: "error", title: "Logout failed", message: "Please try again." });
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" onBack={() => router.back()} />

        <View className="px-6 pt-6">
          <View className={`rounded px-5 py-5 border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-surface border-border"}`}>
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
                  @{profile?.username ?? user?.email ?? "user"}
                </Text>
                <Text className={`font-geist font-bold text-[10px] tracking-[2px] uppercase mt-3 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
                  {role} control center
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mt-4">
              <View className={`px-3 py-2 rounded border ${isDark ? "bg-[#1a1c1d] border-[#46464e]" : "bg-white border-border"}`}>
                <Text className={`font-geist font-bold text-[10px] tracking-[2px] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {theme}
                </Text>
              </View>
              <View className={`px-3 py-2 rounded border ${isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"}`}>
                <Text className={`font-geist font-bold text-[10px] tracking-[2px] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
                  {language}
                </Text>
              </View>
              <View className="px-3 py-2 rounded bg-primary">
                <Text className="font-geist font-bold text-[10px] tracking-[2px] uppercase text-white">
                  {role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <SettingsSection title="Account Controls" dark={isDark}>
          <SettingsRow
            icon={UserCog}
            title="Account Information"
            subtitle="Edit your phone number, role details, and profile image."
            onPress={() => router.push("/(settings)/accountInfoScreen")}
            dark={isDark}
          />
          <SettingsRow
            icon={Lock}
            title="Password & Security"
            subtitle="Update credentials and protect access to your account."
            onPress={() => router.push("/(settings)/changePasswordScreen")}
            dark={isDark}
          />
          <SettingsRow
            icon={Bell}
            title="Notifications"
            subtitle="Choose which alerts reach you across email, push, and SMS."
            onPress={() => router.push("/(settings)/notificationScreen")}
            last
            dark={isDark}
          />
        </SettingsSection>

        <SettingsSection title="Preferences" dark={isDark}>
          <SettingsRow
            icon={Palette}
            title="Appearance"
            subtitle="Switch the interface between light and dark presentation."
            value={resolvedTheme.toUpperCase()}
            onPress={handleThemeToggle}
            dark={isDark}
          />
          <SettingsRow
            icon={Globe}
            title="Language"
            subtitle="Set your preferred language for the app experience."
            value={language}
            onPress={handleLanguageToggle}
            last
            dark={isDark}
          />
        </SettingsSection>

        <SettingsSection title="Support & Legal" dark={isDark}>
          <SettingsRow
            icon={HelpCircle}
            title="Help Center"
            subtitle="Find guidance for orders, accounts, and marketplace flows."
            onPress={() => router.push("/support/help" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={ShieldCheck}
            title="Privacy Policy"
            subtitle="Review how your data is handled across Markt."
            onPress={() => router.push("/support/privacy" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Lock}
            title="Terms of Use"
            subtitle="Understand your rights and responsibilities on Markt."
            onPress={() => router.push("/support/terms" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Info}
            title="About Markt"
            subtitle="Read product, policy, and platform information."
            onPress={() => router.push("/support/about" as any)}
            last
            dark={isDark}
          />
        </SettingsSection>

        <View className="px-6 pt-10">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            className="h-14 rounded bg-primary items-center justify-center flex-row gap-2"
          >
            <LogOut size={18} color="#FFFFFF" strokeWidth={1.8} />
            <Text className="text-white font-geist font-bold text-xs tracking-[2px] uppercase">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
