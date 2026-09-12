import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Tag, Check } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import { discountAmountFor } from "../../models/chat";
import type { SpendableDiscount } from "../../models/chat";

const money = (n: number) => {
  try {
    return Intl.NumberFormat(undefined, {
      style: "currency", currency: "NGN", maximumFractionDigits: 2,
    }).format(n || 0);
  } catch {
    return `₦${(n || 0).toFixed(2)}`;
  }
};

interface Props {
  discount: SpendableDiscount;
  /** What the offer is actually computed on: this shop's items, or just the
   *  one product when the offer was made about a product. */
  subtotal: number;
  /** That product's name, when the offer is pinned to one. */
  productName?: string | null;
  applied: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * The offer a seller made in chat, on the card for that seller's items.
 *
 * Opt-in rather than applied automatically: an offer is usually single-use,
 * and spending it on a small basket when the buyer was saving it for a bigger
 * one is the kind of thing a shop gets blamed for. Tapping is cheap; an offer
 * spent by surprise is not recoverable.
 */
export default function ChatDiscountOption({
  discount, subtotal, applied, onChange, disabled, productName,
}: Props) {
  const t = useTokens();
  const amount = discountAmountFor(discount, subtotal);
  if (amount <= 0) return null;

  const label =
    discount.discount_type === "percentage"
      ? `${discount.discount_value}% off`
      : `${money(discount.discount_value)} off`;

  return (
    <TouchableOpacity
      onPress={() => onChange(!applied)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: applied, disabled: !!disabled }}
      accessibilityLabel={`${label} offered in chat. ${
        applied ? `Applied, ${money(amount)} off.` : "Tap to apply."
      }`}
      className={`mt-3 flex-row items-center gap-3 rounded-xl border p-3 ${
        applied ? "border-primary-fill bg-surface-sunken" : "border-border bg-surface-sunken"
      }`}
    >
      <Tag size={18} color={applied ? t.primaryText : t.textSecondary} />
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-text-primary">
          {/* Naming the product matters: the buyer would otherwise work out
              the percentage against their whole basket and wonder why the
              number is smaller. */}
          {discount.product_id
            ? `${label} on ${productName || "one item"}`
            : `${label} from this shop`}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-4 text-text-secondary">
          {applied
            ? `${money(amount)} comes off this order`
            : discount.discount_message?.trim()
              ? discount.discount_message.trim()
              : `Offered in chat — tap to take ${money(amount)} off`}
        </Text>
      </View>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border ${
          applied ? "border-primary-fill bg-primary-fill" : "border-border"
        }`}
      >
        {applied ? <Check size={14} color={t.textOnPrimary} /> : null}
      </View>
    </TouchableOpacity>
  );
}
