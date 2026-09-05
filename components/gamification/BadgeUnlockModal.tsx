import React from "react";
import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import { Award } from "lucide-react-native";
import { useTheme } from "../themeProvider";
import type { BadgeEarnedEvent } from "../../types/gamification";

export interface BadgeUnlockModalProps {
  visible: boolean;
  badge: BadgeEarnedEvent["badge"] | null;
  onClose: () => void;
}

/**
 * Celebratory overlay shown when a badge is earned in realtime.
 * (Lottie confetti asset is supplied by design; this is the MVP treatment.)
 */
export default function BadgeUnlockModal({
  visible,
  badge,
  onClose,
}: BadgeUnlockModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Modal visible={visible && !!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View
          className={`w-full rounded-2xl items-center px-6 py-8 ${
            isDark ? "bg-surface-raised" : "bg-white"
          }`}
        >
          <Text className="text-3xl mb-2">🎉</Text>
          <Text
            className={`font-bold text-[10px] tracking-[3px] uppercase ${
              isDark ? "text-text-secondary" : "text-tertiary"
            }`}
          >
            Badge Unlocked
          </Text>

          <View
            className={`w-24 h-24 rounded-full items-center justify-center my-5 ${
              isDark ? "bg-surface-sunken" : "bg-surface"
            }`}
          >
            {badge?.icon_url ? (
              <Image
                source={{ uri: badge.icon_url }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
              />
            ) : (
              <Award size={44} color={isDark ? "#f0f1f2" : "#000000"} />
            )}
          </View>

          <Text
            className={`font-bold text-xl text-center ${
              isDark ? "text-text-primary" : "text-black"
            }`}
          >
            {badge?.name}
          </Text>
          {!!badge?.description && (
            <Text
              className={`text-sm text-center mt-2 ${
                isDark ? "text-text-secondary" : "text-tertiary"
              }`}
            >
              {badge.description}
            </Text>
          )}

          <TouchableOpacity
            onPress={onClose}
            className="bg-primary rounded h-12 items-center justify-center mt-6 w-full"
          >
            <Text className="text-white font-bold">Awesome</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
