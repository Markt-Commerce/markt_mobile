import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../themeProvider";
import type { LeaderboardScope } from "../../types/gamification";

const TABS: { id: LeaderboardScope; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "buyers", label: "Buyers" },
  { id: "sellers", label: "Sellers" },
];

export interface LeaderboardScopeTabsProps {
  scope: LeaderboardScope;
  onChange: (scope: LeaderboardScope) => void;
  className?: string;
}

/** Global / Buyers / Sellers segmented control. */
export default function LeaderboardScopeTabs({
  scope,
  onChange,
  className = "",
}: LeaderboardScopeTabsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View
      className={`flex-row rounded p-1 border ${
        isDark ? "bg-[#2f3132] border-[#46464e]" : "bg-surface border-border"
      } ${className}`}
    >
      {TABS.map((t) => {
        const active = scope === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => onChange(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 py-2 rounded items-center ${active ? "bg-primary" : ""}`}
          >
            <Text
              className={`font-geist font-bold text-xs ${
                active ? "text-white" : isDark ? "text-[#c6c5cf]" : "text-tertiary"
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
