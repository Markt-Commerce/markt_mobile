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
import { useTokens } from "../theme/useTokens";

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhotos: () => void;
  onProducts?: () => void;
  onRequests?: () => void;
  onDiscounts?: () => void;
  /** Sellers only: open the form that makes a new offer. */
  onCreateDiscount?: () => void;
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
  const t = useTokens();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      accessibilityState={{ disabled }}
      className={`flex-1 items-center py-2 ${disabled ? "opacity-50" : ""}`}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center mb-2 bg-surface-sunken">
        <Icon size={22} color={t.textPrimary} />
      </View>
      <Text
        className="font-semibold text-[13px] text-text-primary"
        numberOfLines={1}
      >
        {label}
      </Text>
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
  onCreateDiscount,
  role = "buyer",
}: Props) {
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);

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
        className="absolute bottom-0 left-0 right-0 rounded-t shadow-level-2 overflow-hidden bg-surface-raised"
      >
        <View
          className="w-10 h-1 rounded self-center mt-3 mb-2 bg-border-strong"
        />
        <Text
          className="font-bold text-lg px-5 mb-4 text-text-primary"
        >
          Attach
        </Text>

        {/* One row, not a stacked grid of section-headed cards. There are
            four choices; giving each a 135px card and its own heading made
            the sheet nearly half the screen to say very little. */}
        <View className="flex-row px-3 pb-4">
          <OptionCard
            icon={Camera}
            label="Camera"
            onPress={() => handleOption(onCamera)}
            disabled={busy}
          />
          <OptionCard
            icon={ImageIcon}
            label="Photos"
            onPress={() => handleOption(onPhotos)}
            disabled={busy}
          />
          {role === "seller" && onProducts ? (
            <OptionCard
              icon={ShoppingBag}
              label="Product"
              onPress={() => handleOption(onProducts)}
              disabled={busy}
            />
          ) : null}
          {role === "buyer" && onRequests ? (
            <OptionCard
              icon={FileText}
              label="Request"
              onPress={() => handleOption(onRequests)}
              disabled={busy}
            />
          ) : null}
          {/* A seller can now make one, not just look at the ones that
              exist. The endpoint was always there; nothing called it. */}
          {role === "seller" && onCreateDiscount ? (
            <OptionCard
              icon={Percent}
              label="Discount"
              onPress={() => handleOption(onCreateDiscount)}
              disabled={busy}
            />
          ) : onDiscounts ? (
            <OptionCard
              icon={Percent}
              label="Offers"
              onPress={() => handleOption(onDiscounts)}
              disabled={busy}
            />
          ) : null}
        </View>

        {/* A seller still needs to see what they have already offered, but it
            is a second-order thing next to making one. */}
        {role === "seller" && onCreateDiscount && onDiscounts ? (
          <TouchableOpacity
            onPress={() => handleOption(onDiscounts)}
            disabled={busy}
            accessibilityRole="button"
            className="mx-5 mb-4 items-center rounded-xl border border-border py-3"
          >
            <Text className="text-[13px] font-semibold text-primary-text">
              See offers in this chat
            </Text>
          </TouchableOpacity>
        ) : null}

        <View className="h-6 bg-surface-page" />
      </View>
    </View>
  );
}
