import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "./themeProvider";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <View className={`flex-row items-center justify-between px-6 py-4 border-b ${isDark ? "border-[#46464e] bg-inverse-surface" : "border-border bg-white"}`}>
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={isDark ? "#f0f1f2" : "#000000"} strokeWidth={1.75} />
      </TouchableOpacity>

      <Text className={`flex-1 text-center text-lg font-geist font-bold ${isDark ? "text-[#f0f1f2]" : "text-black"}`} numberOfLines={1}>
        {title}
      </Text>

      <View className="w-10 items-end">{right ?? <View className="w-10 h-10" />}</View>
    </View>
  );
}
