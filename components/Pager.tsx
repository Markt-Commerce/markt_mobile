import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTokens } from "../theme/useTokens";

/**
 * Previous / page N of M / next.
 *
 * Every list endpoint in this app is paginated and most screens never used
 * it — the seller dashboard asked for page 1 of orders and the first 50
 * products and stopped there, so a seller with 60 products could not reach
 * the last ten at all.
 *
 * Deliberately a pager rather than infinite scroll. These lists are searched,
 * not browsed: the seller is looking for a specific order or product, and
 * "page 3 of 7" answers "how much is left" and "can I go back" in a way an
 * endless feed never does. It also keeps the list short enough that the
 * dashboard's other sections stay reachable.
 *
 * Renders nothing at all for a single page, so a seller with six products
 * never sees controls that would do nothing.
 */
export default function Pager({
  page,
  pages,
  busy = false,
  onChange,
  className = "",
}: {
  page: number;
  pages: number;
  busy?: boolean;
  onChange: (page: number) => void;
  className?: string;
}) {
  const t = useTokens();
  if (!pages || pages <= 1) return null;

  const first = page <= 1;
  const last = page >= pages;

  const Step = ({
    dir,
    disabled,
    label,
  }: {
    dir: "prev" | "next";
    disabled: boolean;
    label: string;
  }) => {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
    return (
      <Pressable
        onPress={() => onChange(dir === "prev" ? page - 1 : page + 1)}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || busy }}
        className={`h-10 w-10 items-center justify-center rounded-full ${
          disabled || busy ? "bg-surface-sunken" : "bg-surface-raised border border-border"
        }`}
      >
        <Icon
          size={18}
          color={disabled || busy ? t.textMuted : t.textPrimary}
          strokeWidth={2.2}
        />
      </Pressable>
    );
  };

  return (
    <View className={`flex-row items-center justify-center gap-4 pt-4 ${className}`}>
      <Step dir="prev" disabled={first} label="Previous page" />
      <View className="min-w-[92px] flex-row items-center justify-center gap-2">
        {busy ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
        <Text className="text-[13px] font-semibold text-text-secondary">
          Page {page} of {pages}
        </Text>
      </View>
      <Step dir="next" disabled={last} label="Next page" />
    </View>
  );
}
