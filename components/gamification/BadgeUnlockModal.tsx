import React from "react";
import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import { Award } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
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
  const t = useTokens();

  return (
    <Modal visible={visible && !!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View
          className={`w-full rounded-2xl items-center px-6 py-8 ${
            "bg-surface-raised"
          }`}
        >
          <Text className="text-3xl mb-2">🎉</Text>
          <Text
            className={`font-bold text-[10px] tracking-[3px] uppercase ${
              "text-text-secondary"
            }`}
          >
            Badge Unlocked
          </Text>

          <View
            className={`w-24 h-24 rounded-full items-center justify-center my-5 ${
              "bg-surface-sunken"
            }`}
          >
            {badge?.icon_url ? (
              <Image
                source={{ uri: badge.icon_url }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
              />
            ) : (
              <Award size={44} color={t.textPrimary} />
            )}
          </View>

          <Text
            className={`font-bold text-xl text-center ${
              "text-text-primary"
            }`}
          >
            {badge?.name}
          </Text>
          {!!badge?.description && (
            <Text
              className={`text-sm text-center mt-2 ${
                "text-text-secondary"
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
