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
import { logoutUser } from "../../services/sections/auth";
import { useToast } from "../../components/ToastProvider";
import { navigateToGuestHome } from "../../utils/authNavigation";
import { useGamificationContext } from "../../hooks/gamificationContext";
import { updateGamificationPreferences } from "../../services/sections/gamification";

const LANGUAGE_KEY = "app_lang_v1";

/**
 * Settings primitives.
 *
 * These used to be a `px-6` inset card with a `rounded border` wrapper and a
 * `border-b` on every row -- a bordered box inside a bordered screen, so each
 * row was outlined twice and 48px of width was given away on every line.
 *
 * Now: a tinted full-bleed band names the group, rows run edge to edge, and the
 * hairline between them is inset to start where the label starts, so the eye
 * reads a list instead of a stack of boxes.
 */
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
    <View className="mt-2">
      <View className={`px-4 py-2.5 ${dark ? "bg-[#141617]" : "bg-[#F4F4F5]"}`}>
        <Text
          className={`font-bold text-[13px] ${dark ? "text-[#c6c5cf]" : "text-[#52525B]"}`}
        >
          {title}
        </Text>
      </View>
      <View className={dark ? "bg-[#1a1c1d]" : "bg-white"}>{children}</View>
    </View>
  );
}

/** The hairline between rows, inset so it lines up under the label. */
function RowDivider({ dark }: { dark: boolean }) {
  return (
    <View className={`h-px ml-[52px] ${dark ? "bg-[#2f3132]" : "bg-[#EFEFF1]"}`} />
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
  destructive = false,
}: {
  icon: React.ElementType;
  title: string;
  /** Only when it says something the label doesn't. Most rows don't need one. */
  subtitle?: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  dark?: boolean;
  destructive?: boolean;
}) {
  const labelColor = destructive
    ? "text-[#DC2626]"
    : dark
      ? "text-[#f0f1f2]"
      : "text-black";
  const iconColor = destructive ? "#DC2626" : dark ? "#c6c5cf" : "#3F3F46";

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={value ? `${title}, ${value}` : title}
        className="flex-row items-center px-4 min-h-[56px] py-3"
      >
        {/* No tinted tile behind the glyph -- it was a third surface competing
            with the card and the row. */}
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
        <View className="flex-1 ml-4 pr-3">
          <Text className={`text-[16px] ${labelColor}`}>{title}</Text>
          {subtitle ? (
            <Text
              className={`text-[13px] mt-0.5 leading-[18px] ${dark ? "text-[#8f9195]" : "text-tertiary"}`}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text
            className={`text-[14px] mr-2 ${dark ? "text-[#8f9195]" : "text-tertiary"}`}
          >
            {value}
          </Text>
        ) : null}
        <ArrowRight
          size={18}
          color={dark ? "#6b6d71" : "#A1A1AA"}
          strokeWidth={2}
        />
      </TouchableOpacity>
      {last ? null : <RowDivider dark={dark} />}
    </>
  );
}

function SettingsSwitchRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  last = false,
  dark = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
  dark?: boolean;
}) {
  return (
    <>
      <View className="flex-row items-center px-4 min-h-[56px] py-3">
        <Icon size={20} color={dark ? "#c6c5cf" : "#3F3F46"} strokeWidth={1.8} />
        <View className="flex-1 ml-4 pr-3">
          <Text className={`text-[16px] ${dark ? "text-[#f0f1f2]" : "text-black"}`}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className={`text-[13px] mt-0.5 leading-[18px] ${dark ? "text-[#8f9195]" : "text-tertiary"}`}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: dark ? "#46464e" : "#E4E4E7", true: "#E94C2A" }}
          thumbColor="#FFFFFF"
        />
      </View>
      {last ? null : <RowDivider dark={dark} />}
    </>
  );
}

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
    <SafeAreaView className={`flex-1 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        className={isDark ? "flex-1 bg-[#1a1c1d]" : "flex-1 bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" onBack={() => router.back()} />

        {/* Centered identity, no card. This was a bordered box holding three
            more bordered chips -- four outlines stacked in one header. The
            tinted band does the separating, so nothing needs an outline. */}
        <View className={`items-center px-6 pt-4 pb-6 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
          <Avatar
            uri={profile?.profile_picture_url}
            name={displayName}
            size={88}
            className="rounded-full"
          />
          <Text
            className={`font-bold text-[22px] tracking-tight mt-3 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            className={`text-[14px] mt-0.5 ${isDark ? "text-[#8f9195]" : "text-tertiary"}`}
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
            <View className={`px-3 py-1.5 rounded-full ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}>
              <Text className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-[#52525B]"}`}>
                {theme}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}>
              <Text className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? "text-[#c6c5cf]" : "text-[#52525B]"}`}>
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
            className={`h-13 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${isDark ? "bg-[#2f3132]" : "bg-[#F4F4F5]"}`}
          >
            <LogOut size={18} color={isDark ? "#f0f1f2" : "#3F3F46"} strokeWidth={1.9} />
            <Text className={`font-semibold text-[15px] ${isDark ? "text-[#f0f1f2]" : "text-[#3F3F46]"}`}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
