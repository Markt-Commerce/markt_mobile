import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

  return (
    <View
      className={`flex-row rounded p-1 border ${
        "bg-surface-sunken border-border"
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
              className={`font-bold text-xs ${
                active ? "text-white" : "text-text-secondary"
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
