import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Palette,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Trophy,
  UserCog,
  Wallet,
} from "lucide-react-native";
import ScreenHeader from "../../components/ScreenHeader";
import Avatar from "../../components/Avatar";
import { useUser } from "../../hooks/userContextProvider";
import { useTheme } from "../../components/themeProvider";
import {
  SettingsSection,
  SettingsRow,
  SettingsSwitchRow,
} from "../../components/SettingsList";
import { logoutUser } from "../../services/sections/auth";
import { useToast } from "../../components/ToastProvider";
import { navigateToGuestHome } from "../../utils/authNavigation";
import { useGamificationContext } from "../../hooks/gamificationContext";
import { updateGamificationPreferences } from "../../services/sections/gamification";

const LANGUAGE_KEY = "app_lang_v1";

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { user, role, setUser, profile } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { show } = useToast();
  const [language, setLanguage] = useState("EN");
  const { profile: gamification, refresh: refreshGamification } = useGamificationContext();
  const [leaderboardOptOut, setLeaderboardOptOut] = useState(false);
  const [leaderboardUpdating, setLeaderboardUpdating] = useState(false);

  const displayName =
    role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "Shop";

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored) setLanguage(stored.toUpperCase());
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (gamification) setLeaderboardOptOut(gamification.opt_out_leaderboard);
  }, [gamification]);

  const handleLeaderboardToggle = async (showOnLeaderboard: boolean) => {
    if (leaderboardUpdating) return;
    const nextOptOut = !showOnLeaderboard;
    const prev = leaderboardOptOut;
    setLeaderboardOptOut(nextOptOut);
    setLeaderboardUpdating(true);
    try {
      await updateGamificationPreferences({ opt_out_leaderboard: nextOptOut });
      refreshGamification();
    } catch {
      setLeaderboardOptOut(prev);
      show({ variant: "error", title: "Error", message: "Could not update leaderboard preference." });
    } finally {
      setLeaderboardUpdating(false);
    }
  };

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
    <SafeAreaView className={`flex-1 bg-surface-raised`} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "flex-1 bg-surface-raised" : "flex-1 bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" onBack={() => router.back()} />

        {/* Centered identity, no card. This was a bordered box holding three
            more bordered chips -- four outlines stacked in one header. The
            tinted band does the separating, so nothing needs an outline. */}
        <View className={`items-center px-6 pt-4 pb-6 bg-surface-raised`}>
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
            @{profile?.username ?? user?.email ?? "user"}
          </Text>

          {/* Tint only. The role is the one that matters, so it keeps the
              brand colour and the other two sit back. */}
          <View className="flex-row flex-wrap justify-center gap-2 mt-4">
            <View className="px-3 py-1.5 rounded-full bg-primary">
              <Text className="font-bold text-[11px] uppercase tracking-wider text-white">
                {role}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full bg-surface-sunken`}>
              <Text className={`font-bold text-[11px] uppercase tracking-wider text-text-secondary`}>
                {theme}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full bg-surface-sunken`}>
              <Text className={`font-bold text-[11px] uppercase tracking-wider text-text-secondary`}>
                {language}
              </Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Account Controls" dark={isDark}>
          <SettingsRow
            icon={UserCog}
            title="Account Information"
            onPress={() => router.push("/(settings)/accountInfoScreen")}
            dark={isDark}
          />
          <SettingsRow
            icon={Lock}
            title="Password & Security"
            onPress={() => router.push("/(settings)/changePasswordScreen")}
            dark={isDark}
          />
          <SettingsRow
            icon={Wallet}
            title="Wallet"
            onPress={() => router.push("/wallet" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Bookmark}
            title="Saved"
            onPress={() => router.push("/saved" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={ShieldOff}
            title="Blocked accounts"
            onPress={() => router.push("/(settings)/blockedAccountsScreen" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Bell}
            title="Notifications"
            onPress={() => router.push("/(settings)/notificationScreen")}
            last
            dark={isDark}
          />
        </SettingsSection>

        <SettingsSection title="Preferences" dark={isDark}>
          <SettingsRow
            icon={Palette}
            title="Appearance"
            value={resolvedTheme.toUpperCase()}
            onPress={handleThemeToggle}
            dark={isDark}
          />
          <SettingsRow
            icon={Globe}
            title="Language"
            value={language}
            onPress={handleLanguageToggle}
            dark={isDark}
          />
          <SettingsSwitchRow
            icon={Trophy}
            title="Show on leaderboard"
            subtitle="Let other users see your rank and username on the gamification leaderboard."
            value={!leaderboardOptOut}
            onValueChange={handleLeaderboardToggle}
            disabled={leaderboardUpdating}
            last
            dark={isDark}
          />
        </SettingsSection>

        <SettingsSection title="Support & Legal" dark={isDark}>
          <SettingsRow
            icon={HelpCircle}
            title="Help Center"
            onPress={() => router.push("/support/help" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={ShieldCheck}
            title="Privacy Policy"
            onPress={() => router.push("/support/privacy" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Lock}
            title="Terms of Use"
            onPress={() => router.push("/support/terms" as any)}
            dark={isDark}
          />
          <SettingsRow
            icon={Info}
            title="About Markt"
            onPress={() => router.push("/support/about" as any)}
            last
            dark={isDark}
          />
        </SettingsSection>

        {/* Apple App Store 5.1.1(v): account deletion has to be reachable from
            inside the app, not only from a website. */}
        <SettingsSection title="Danger Zone" dark={isDark}>
          <SettingsRow
            icon={Trash2}
            destructive
            title="Delete account"
            subtitle="Permanently delete your account and personal data."
            onPress={() => router.push("/(settings)/deleteAccountScreen" as any)}
            last
            dark={isDark}
          />
        </SettingsSection>

        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            className={`h-13 py-3.5 rounded-xl items-center justify-center flex-row gap-2 bg-surface-sunken`}
          >
            <LogOut size={18} color={isDark ? "#f0f1f2" : "#3F3F46"} strokeWidth={1.9} />
            <Text className={`font-semibold text-[15px] ${isDark ? "text-text-primary" : "text-[#3F3F46]"}`}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
