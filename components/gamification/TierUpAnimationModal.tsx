import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "../themeProvider";
import TierBadge from "./TierBadge";
import type { TierChangedEvent } from "../../types/gamification";

export interface TierUpAnimationModalProps {
  visible: boolean;
  event: TierChangedEvent | null;
  onClose: () => void;
}

/**
 * Celebratory overlay shown when the current user's tier changes in realtime.
 * (Lottie confetti asset is supplied by design; this is the MVP treatment,
 * matching BadgeUnlockModal.)
 */
export default function TierUpAnimationModal({
  visible,
  event,
  onClose,
}: TierUpAnimationModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Modal visible={visible && !!event} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View
          className={`w-full rounded-2xl items-center px-6 py-8 ${
            isDark ? "bg-[#1a1c1d]" : "bg-white"
          }`}
        >
          <Text className="text-3xl mb-2">🚀</Text>
          <Text
            className={`font-bold text-[10px] tracking-[3px] uppercase ${
              isDark ? "text-[#c6c5cf]" : "text-tertiary"
            }`}
          >
            Level Up
          </Text>

          {event && (
            <View className="my-5">
              <TierBadge tier={event.new_tier} stars={event.stars} size="lg" showName />
            </View>
          )}

          <Text
            className={`font-bold text-xl text-center ${
              isDark ? "text-[#f0f1f2]" : "text-black"
            }`}
          >
            You reached a new tier!
          </Text>
          <Text
            className={`text-sm text-center mt-2 ${
              isDark ? "text-[#c6c5cf]" : "text-tertiary"
            }`}
          >
            Keep going to unlock the next one.
          </Text>

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
