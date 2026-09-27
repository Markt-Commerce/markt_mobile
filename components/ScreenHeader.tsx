import React from "react";
import { View, Text } from "react-native";

import BackButton from "./BackButton";

interface ScreenHeaderProps {
  title: string;
  /** Where back goes when there is nothing to go back to. Screens that want
   *  to handle it themselves pass `onBack` instead. */
  fallback?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  fallback = "/(tabs)",
  onBack,
  right,
}: ScreenHeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-surface-raised"
    >
      <BackButton fallback={fallback} onPress={onBack} />

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
