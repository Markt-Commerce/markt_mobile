import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useTokens } from "../theme/useTokens";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  onBack,
  right,
}: ScreenHeaderProps) {
  const t = useTokens();
  return (
    <View
      className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-surface-raised"
    >
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft
          size={22}
          color={t.textPrimary}
          strokeWidth={1.75}
        />
      </TouchableOpacity>

      <Text
        className="flex-1 text-center text-lg font-bold text-text-primary"
        numberOfLines={1}
      >
        {title}
      </Text>

      <View className="w-10 items-end">
        {right ?? <View className="w-10 h-10" />}
      </View>
    </View>
  );
}
