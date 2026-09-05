import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Lock, Award } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { Badge } from "../../types/gamification";

export interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  progress?: number; // 0..1
  onPress?: () => void;
  className?: string;
}

/** Single badge tile — full-colour when earned, desaturated + progress when locked. */
export default function BadgeCard({
  badge,
  earned,
  progress = 0,
  onPress,
  className = "",
}: BadgeCardProps) {
  const t = useTokens();
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}${earned ? ", earned" : ", locked"}`}
      className={`rounded border p-3 items-center ${
        "bg-surface-raised border-border"
      } ${className}`}
      style={{ opacity: earned ? 1 : 0.55 }}
    >
      <View
        className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${
          "bg-surface-sunken"
        }`}
      >
        {badge.icon_url ? (
          <Image
            source={{ uri: badge.icon_url }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : earned ? (
          <Award size={26} color={t.textPrimary} />
        ) : (
          <Lock size={22} color={t.textSecondary} />
        )}
      </View>

      <Text
        numberOfLines={1}
        className={`font-bold text-xs text-center ${
          "text-text-primary"
        }`}
      >
        {badge.name}
      </Text>

      {!earned && progress > 0 && progress < 1 && (
        <View
          className={`h-1 w-full rounded overflow-hidden mt-2 ${
            "bg-surface-sunken"
          }`}
        >
          <View className="h-1 bg-primary rounded" style={{ width: `${pct}%` }} />
        </View>
      )}
    </TouchableOpacity>
  );
}
