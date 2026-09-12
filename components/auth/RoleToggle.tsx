import React from "react";
import { Text, View, Pressable } from "react-native";
import { ShoppingBag, Store } from "lucide-react-native";
import { AccountType } from "../../models/auth";
import { useTokens } from "../../theme/useTokens";
import * as haptics from "../../utils/haptics";

/**
 * Buyer / seller, as a segmented control.
 *
 * Shared by sign-in and sign-up, which had two hand-rolled copies that had
 * already drifted apart — different labels, different weights, and both using
 * `text-white` on the selected half instead of the on-primary token.
 *
 * A segmented control rather than the two explanatory cards used in the
 * `(onboarding)` group: there, the role *is* the screen, and it deserves the
 * space. Here it is one field among four, so it has to read as part of the
 * stack rather than as the page's main event. The selected half carries the
 * fill — a border-only selection disappears at a glance on a filled row.
 */
export default function RoleToggle({
  value,
  onChange,
  className = "",
}: {
  value: AccountType | null | undefined;
  onChange: (role: AccountType) => void;
  className?: string;
}) {
  const t = useTokens();

  return (
    <View
      className={`flex-row items-center rounded-xl p-1 bg-surface-sunken ${className}`}
      accessibilityRole="radiogroup"
    >
      {(["buyer", "seller"] as const).map((option) => {
        const selected = value === option;
        const Icon = option === "buyer" ? ShoppingBag : Store;
        return (
          <Pressable
            key={option}
            onPress={() => {
              haptics.tick();
              onChange(option);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option === "buyer" ? "Buying" : "Selling"}
            className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${
              selected ? "bg-primary-fill" : ""
            }`}
          >
            <Icon
              size={16}
              strokeWidth={2}
              color={selected ? t.textOnPrimary : t.textSecondary}
            />
            <Text
              className={`text-sm font-semibold ${
                selected ? "text-text-on-primary" : "text-text-secondary"
              }`}
            >
              {option === "buyer" ? "Buying" : "Selling"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
