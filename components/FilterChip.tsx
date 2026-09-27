/**
 * The filter rail the shop list settled on, so other screens stop inventing
 * their own.
 *
 * Every screen with filters had grown a private version: rounded-full pills
 * here, bordered `rounded` boxes there, one with 10px uppercase labels and
 * another with 13px sentence case, and two different ideas about what
 * "selected" looks like. Same control, four appearances.
 */
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export function FilterChip({
  label,
  active,
  onPress,
  tone = "primary",
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  /** "neutral" inverts the page instead of using the brand fill. Use it for a
   *  second rail of chips next to a primary one, so the two rails do not both
   *  shout. */
  tone?: "primary" | "neutral";
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={`h-9 items-center justify-center rounded-full px-4 ${
        active
          ? tone === "primary"
            ? "bg-primary-fill"
            : "bg-text-primary"
          : "bg-surface-sunken"
      }`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          active
            ? tone === "primary"
              ? "text-text-on-primary"
              : // The neutral chip inverts the page: its fill is text-primary,
                // so its label has to be the page, not "on primary" — that
                // token is white in both themes, which on dark put white text
                // on a white pill.
                "text-surface-page"
            : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * One horizontal rail of chips.
 *
 * `flexGrow: 0` is doing real work: a horizontal ScrollView in a column has no
 * intrinsic height, so it stretches to fill whatever the list below does not
 * claim — leaving the chips floating in the middle of a tall empty band.
 */
export function FilterRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
        alignItems: "center",
      }}
    >
      {children}
    </ScrollView>
  );
}

/** The hairline between two groups of chips on one rail. */
export function RailDivider() {
  return <View className="mx-1 h-5 w-px bg-border" />;
}
