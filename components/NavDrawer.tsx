/**
 * NavDrawer — Twitter-style side drawer (slide-in from left)
 * BUYER_SELLER_NAV_REDESIGN_AND_ACTIONS.md
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
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center gap-4 px-4 py-3"
    activeOpacity={0.7}
  >
    <View className="w-9 h-9 rounded-full bg-bg-muted items-center justify-center">
      <Icon size={20} color="#171311" />
    </View>
    <Text className="text-text-primary font-medium text-base">{label}</Text>
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
        .catch(() => {});
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
      show({
        variant: "error",
        title: "Could not switch",
        message: "Please try again.",
      });
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
          backgroundColor: "white",
          zIndex: 999,
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-1 pt-14 pb-8">
          {/* Header: avatar, name, handle */}
          <View className="px-4 pb-4 border-b border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Avatar
                uri={profile?.profile_picture_url}
                name={displayName}
                size={56}
              />
              <TouchableOpacity
                onPress={onClose}
                className="p-2 -mr-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={22} color="#876d64" />
              </TouchableOpacity>
            </View>
            <Text className="text-text-primary font-bold text-lg" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-text-secondary text-sm" numberOfLines={1}>
              @{profile?.username ?? "user"}
            </Text>
            <View className="flex-row mt-2 gap-2">
              <View
                className={`px-3 py-1.5 rounded-full ${role === "buyer" ? "bg-primary" : "bg-[#e5dedc]"}`}
              >
                <Text
                  className={`text-xs font-semibold ${role === "buyer" ? "text-white" : "text-text-secondary"}`}
                >
                  Buyer
                </Text>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${role === "seller" ? "bg-primary" : "bg-[#e5dedc]"}`}
              >
                <Text
                  className={`text-xs font-semibold ${role === "seller" ? "text-white" : "text-text-secondary"}`}
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
              className="flex-row items-center gap-3 mx-4 mt-4 py-3 px-4 rounded-xl bg-primary"
              activeOpacity={0.85}
            >
              <RefreshCw size={20} color="white" />
              <Text className="text-white font-semibold">
                Switch to {role === "buyer" ? "Seller" : "Buyer"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Menu items */}
          <View className="mt-4">
            <Row icon={User} label="Profile" onPress={() => nav("/(tabs)/profile")} />
            {role === "seller" && (
              <Row icon={LayoutDashboard} label="Dashboard" onPress={() => nav("/(tabs)/sellerDashboard")} />
            )}
            <Row icon={Users} label="Niches" onPress={() => nav("/myniches")} />
            <Row icon={Settings} label="Settings" onPress={() => nav("/(settings)/settingsProfileScreen")} />
            <Row icon={HelpCircle} label="Help Center" onPress={() => nav("/support/help")} />
          </View>
        </View>
      </Animated.View>
    </>
  );
}
