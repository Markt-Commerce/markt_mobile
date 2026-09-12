import React from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { DeliveryQuote } from "../../models/delivery";

interface Props {
  quote: DeliveryQuote | null;
  value: boolean;
  onChange: (next: boolean) => void;
}

/**
 * Sharing a delivery run with other orders going the same way.
 *
 * Only shown when the server says sharing is actually on offer -- the flag
 * is a deployment fact the app cannot know, and a switch for something that
 * never happens is worse than no switch.
 *
 * The wording is load-bearing rather than decorative. Paystack will not hold
 * naira (see ADR-002's amendment), so this is charge-now-refund-later: the
 * buyer's money genuinely leaves and comes back over days. Finding that out
 * afterwards feels like our mistake even when it is exactly what was
 * supposed to happen, so it is said before they agree, not after.
 */
export default function BatchDeliveryOption({ quote, value, onChange }: Props) {
  const t = useTokens();
  if (!quote?.batch_available) return null;

  const fee = quote.fee_minor / 100;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Share this delivery with other orders going the same way"
      className="mt-3 rounded-xl bg-surface-sunken p-4"
    >
      <View className="flex-row items-center">
        <Users size={18} color={t.textSecondary} />
        <Text className="ml-2 flex-1 text-[15px] font-semibold text-text-primary">
          Share this delivery
        </Text>
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel="Share this delivery"
        />
      </View>

      <Text className="mt-2 text-[13px] leading-5 text-text-secondary">
        If other orders are heading your way, you split the trip and pay less.
      </Text>

      {value ? (
        <Text className="mt-2 text-[12px] leading-[18px] text-text-muted">
          {`You'll be charged ₦${fee.toFixed(2)} now. Once the shared trip is `}
          {`confirmed we refund the difference to your card, usually within a `}
          {`few days. Sharing can never cost more than ₦${fee.toFixed(2)}.`}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
