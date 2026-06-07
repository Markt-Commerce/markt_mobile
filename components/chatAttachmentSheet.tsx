/**
 * ChatAttachmentSheet — "+" attachment options (Camera, Photos, Products, Requests)
 * CHATS_API §2.4
 */

import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Keyboard } from "react-native";
import {
  Camera,
  Image as ImageIcon,
  ShoppingBag,
  FileText,
  Percent,
} from "lucide-react-native";
import { useTheme } from "./themeProvider";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhotos: () => void;
  onProducts?: () => void;
  onRequests?: () => void;
  onDiscounts?: () => void;
  role?: "buyer" | "seller";
};

const OptionCard = ({
  icon: Icon,
  label,
  onPress,
  subtitle,
  disabled = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  subtitle?: string;
  disabled?: boolean;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`flex-1 min-w-[100px] max-w-[110px] rounded border p-4 items-center ${isDark ? "bg-dark-elevated border-dark-border-strong" : "bg-white border-border"} ${disabled ? "opacity-50" : ""}`}
    >
      <View
        className={`w-14 h-14 rounded items-center justify-center mb-3 ${isDark ? "bg-dark-surface" : "bg-surface"}`}
      >
        <Icon size={28} color={isDark ? "#f5f5f5" : "#000000"} />
      </View>
      <Text
        className={`font-geist font-semibold text-sm ${isDark ? "text-dark-text" : "text-black"}`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {subtitle && (
        <Text
          className={`text-[11px] mt-0.5 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function ChatAttachmentSheet({
  visible,
  busy = false,
  onClose,
  onCamera,
  onPhotos,
  onProducts,
  onRequests,
  onDiscounts,
  role = "buyer",
}: Props) {
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!visible) return null;

  const handleOption = (fn: () => void) => {
    if (busy) return;
    onClose();
    fn();
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 999,
      }}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        onPress={onClose}
        activeOpacity={1}
      />
      <View
        className={`absolute bottom-0 left-0 right-0 rounded-t shadow-level-2 overflow-hidden ${isDark ? "bg-dark-surface" : "bg-white"}`}
      >
        <View
          className={`w-10 h-1 rounded self-center mt-3 mb-2 ${isDark ? "bg-dark-border-strong" : "bg-border"}`}
        />
        <Text
          className={`font-geist font-bold text-lg px-5 mb-4 ${isDark ? "text-dark-text" : "text-black"}`}
        >
          Attach
        </Text>

        <View className="px-5 pb-6">
          <Text
            className={`text-xs font-geist font-bold uppercase tracking-wider mb-3 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
          >
            Media
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <OptionCard
              icon={Camera}
              label="Camera"
              onPress={() => handleOption(onCamera)}
              subtitle="Take photo"
              disabled={busy}
            />
            <OptionCard
              icon={ImageIcon}
              label="Photos"
              onPress={() => handleOption(onPhotos)}
              subtitle="From gallery"
              disabled={busy}
            />
          </View>

          {(role === "seller" && onProducts) ||
          (role === "buyer" && onRequests) ? (
            <>
              <Text
                className={`text-xs font-geist font-bold uppercase tracking-wider mt-5 mb-3 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
              >
                {role === "seller" ? "Share" : "More"}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {role === "seller" && onProducts && (
                  <OptionCard
                    icon={ShoppingBag}
                    label="Products"
                    onPress={() => handleOption(onProducts)}
                    subtitle="Share listing"
                    disabled={busy}
                  />
                )}
                {role === "buyer" && onRequests && (
                  <OptionCard
                    icon={FileText}
                    label="Requests"
                    onPress={() => handleOption(onRequests)}
                    subtitle="Share request"
                    disabled={busy}
                  />
                )}
                {onDiscounts && (
                  <OptionCard
                    icon={Percent}
                    label="Discounts"
                    onPress={() => handleOption(onDiscounts)}
                    subtitle="View offers"
                    disabled={busy}
                  />
                )}
              </View>
            </>
          ) : (
            onDiscounts && (
              <>
                <Text
                  className={`text-xs font-geist font-bold uppercase tracking-wider mt-5 mb-3 ${isDark ? "text-dark-muted" : "text-tertiary"}`}
                >
                  Offers
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  <OptionCard
                    icon={Percent}
                    label="Discounts"
                    onPress={() => handleOption(onDiscounts)}
                    subtitle="View offers"
                    disabled={busy}
                  />
                </View>
              </>
            )
          )}
        </View>
        <View className={`h-6 ${isDark ? "bg-dark-page" : "bg-surface"}`} />
      </View>
    </View>
  );
}
