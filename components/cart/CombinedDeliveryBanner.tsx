import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Bike } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { CombinedDeliveryQuote } from "../../models/delivery";

const money = (minor: number) => `₦${(minor / 100).toFixed(2)}`;

interface Props {
  quote: CombinedDeliveryQuote | null;
  value: boolean;
  onChange: (next: boolean) => void;
}

/**
 * "These shops are close enough for one rider."
 *
 * Only shown when the server says it is actually possible and actually
 * saves money. A combined trip that saves nothing ties two orders to one
 * rider's schedule for no gain, so the server declines to offer it and this
 * renders nothing.
 */
export default function CombinedDeliveryBanner({ quote, value, onChange }: Props) {
  const t = useTokens();
  if (!quote?.available || !quote.saved_minor) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className="mb-4 rounded-2xl border border-primary bg-primary-muted p-4"
    >
      <View className="flex-row items-center">
        <Bike size={20} color={t.primaryText} />
        <Text className="ml-2 flex-1 text-[15px] font-bold text-text-primary">
          One rider can collect both
        </Text>
        <Switch value={value} onValueChange={onChange} accessibilityLabel="Combine these deliveries" />
      </View>
      <Text className="mt-2 text-[13px] leading-5 text-text-secondary">
        These shops are close together, so one trip covers both — and you pay
        for one trip instead of two. Saves you {money(quote.saved_minor)}.
      </Text>
      {value ? (
        <Text className="mt-2 text-[12px] leading-[18px] text-text-muted">
          Each order is still its own order, with its own seller. Only the
          delivery is shared, and the fee is split between them so neither
          pays more than it would alone.
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
