/**
 * NavDrawer — Twitter-style side drawer (slide-in from left)
 *
 * Header: avatar, display name, handle
 * Switch mode (if is_buyer && is_seller)
 * Menu: Profile, Niches, Settings, Help Center
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Users,
  Settings,
  HelpCircle,
  RefreshCw,
  X,
  LayoutDashboard,
} from "lucide-react-native";
import Avatar from "./Avatar";
import { useUser } from "../hooks/userContextProvider";
import { switchUserRole } from "../services/sections/auth";
import { setUserSession } from "../services/authStorage";
import { useToast } from "./ToastProvider";
import { getUserProfile } from "../services/sections/profile";
import type { UserProfile } from "../models/profile";
import { useTheme } from "./themeProvider";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.8, 320);

interface NavDrawerProps {
  visible: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  onProfileLoaded?: (p: UserProfile) => void;
}

const Row = ({
  icon: Icon,
  label,
  onPress,
  isDark,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  isDark: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center gap-4 px-6 py-4"
    activeOpacity={0.7}
  >
    <View className={`w-10 h-10 rounded items-center justify-center ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}>
      <Icon size={20} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.5} />
    </View>
    <Text className={`font-geist font-bold text-base ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>{label}</Text>
  </TouchableOpacity>
);

export default function NavDrawer({
  visible,
  onClose,
  profile,
  onProfileLoaded,
}: NavDrawerProps) {
  const router = useRouter();
  const { role, setRole, user } = useUser();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && user && !profile) {
      getUserProfile()
        .then((p) => onProfileLoaded?.(p))
        .catch(() => { });
    }
  }, [visible, user, profile]);

  const handleSwitchMode = async () => {
    try {
      const res = await switchUserRole();
      const newRole = (res.user?.current_role ?? res.current_role) as "buyer" | "seller";
      setRole(newRole);
      if (res.user?.email) {
        await setUserSession(
          {
            email: res.user.email,
            account_type: newRole,
            user_id: res.user.id,
          },
          newRole
        );
      }
      show({
        variant: "success",
        title: "Mode switched",
        message: `Now in ${newRole === "seller" ? "Seller" : "Buyer"} mode`,
      });
      onClose();
    } catch {
      // Switch fails when user doesn't have both accounts; offer Create account
      if (profile && !profile.is_seller) {
        show({
          variant: "info",
          title: "Create seller account",
          message: "This action requires a seller account. Create one from Profile.",
        });
        onClose();
        router.push("/(tabs)/profile");
      } else if (profile && !profile.is_buyer) {
        show({
          variant: "info",
          title: "Create buyer account",
          message: "This action requires a buyer account. Create one from Profile.",
        });
        onClose();
        router.push("/(tabs)/profile");
      } else {
        show({
          variant: "error",
          title: "Could not switch",
          message: "Create the missing account from Profile.",
        });
      }
    }
  };

  const nav = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const displayName =
    role === "buyer"
      ? profile?.buyer_account?.buyername ?? profile?.username ?? "User"
      : profile?.seller_account?.shop_name ?? profile?.username ?? "Shop";

  const isDualRole = (profile?.is_buyer && profile?.is_seller) ?? false;

  if (!visible) return null;

  return (
    <>
      <Pressable
        onPress={onClose}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 998 }}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            opacity: overlayOpacity,
          }}
        />
      </Pressable>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: isDark ? "#1a1c1d" : "white",
          zIndex: 999,
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className="flex-1 py-6">
          {/* Header: avatar, name, handle */}
          <View className={`px-6 pb-6 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}>
            <View className="flex-row items-center justify-between mb-6">
              <Avatar
                uri={profile?.profile_picture_url}
                name={displayName}
                size={64}
                className="rounded"
              />
              <TouchableOpacity
                onPress={onClose}
                className="p-2 -mr-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={24} color={isDark ? "#c6c5cf" : "#71717A"} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <Text className={`font-geist font-bold text-xl ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
              {displayName}
            </Text>
            <Text className={`font-inter text-sm mt-1 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`} numberOfLines={1}>
              @{profile?.username ?? "user"}
            </Text>
            <View className="flex-row mt-4 gap-2">
              <View
                className={`px-3 py-1 rounded ${role === "buyer" ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              >
                <Text
                  className={`text-[10px] font-geist font-bold uppercase tracking-wider ${role === "buyer" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                >
                  Buyer
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded ${role === "seller" ? "bg-primary" : isDark ? "bg-[#2f3132]" : "bg-surface"}`}
              >
                <Text
                  className={`text-[10px] font-geist font-bold uppercase tracking-wider ${role === "seller" ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
                >
                  Seller
                </Text>
              </View>
            </View>
          </View>

          {/* Switch mode */}
          {isDualRole && (
            <TouchableOpacity
              onPress={handleSwitchMode}
              className="flex-row items-center gap-3 mx-6 mt-6 h-12 px-6 rounded bg-primary"
              activeOpacity={0.85}
            >
              <RefreshCw size={18} color="white" strokeWidth={2} />
              <Text className="text-white font-geist font-bold text-sm">
                Switch to {role === "buyer" ? "Seller" : "Buyer"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Menu items */}
          <View className="mt-6">
            <Row icon={User} label="Profile" onPress={() => nav("/(tabs)/profile")} isDark={isDark} />
            {role === "seller" && (
              <Row icon={LayoutDashboard} label="Dashboard" onPress={() => nav("/(tabs)/sellerDashboard")} isDark={isDark} />
            )}
            <Row icon={Users} label="Niches" onPress={() => nav("/myniches")} isDark={isDark} />
            <Row icon={Settings} label="Settings" onPress={() => nav("/(settings)/settingsProfileScreen")} isDark={isDark} />
            <Row icon={HelpCircle} label="Help Center" onPress={() => nav("/support/help")} isDark={isDark} />
          </View>
        </View>
      </Animated.View>
    </>
  );
}
