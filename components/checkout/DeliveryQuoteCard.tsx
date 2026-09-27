import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { AlertTriangle, Truck, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { DeliveryQuote } from "../../models/delivery";

/** Kobo to a naira string. Divide only here, at the edge. */
function money(minor: number) {
  const naira = minor / 100;
  try {
    return Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(naira);
  } catch {
    return `₦${naira.toFixed(2)}`;
  }
}

interface Props {
  loading: boolean;
  quote: DeliveryQuote | null;
  /** Set when we can't deliver. Blocks checkout. */
  blocked: { title: string; message: string; actionable: boolean } | null;
  onFixAddress?: () => void;
}

/**
 * The delivery fee, before the buyer commits to anything.
 *
 * Three states, all of which happen: still working it out, a real price, and
 * "we don't reach you". The last is the one worth designing — it used to be
 * impossible to hit, because the fee was a flat number that always existed.
 */
export default function DeliveryQuoteCard({
  loading,
  quote,
  blocked,
  onFixAddress,
}: Props) {
  const t = useTokens();
  const [open, setOpen] = React.useState(false);

  if (blocked) {
    return (
      <View className="mt-4 rounded-xl border border-warning bg-surface-sunken p-4">
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={18} color={t.warningText} />
          <Text className="flex-1 text-[15px] font-bold text-text-primary">
            {blocked.title}
          </Text>
        </View>
        <Text className="mt-2 text-[13px] leading-5 text-text-secondary">
          {blocked.message}
        </Text>
        {blocked.actionable && onFixAddress ? (
          <TouchableOpacity
            onPress={onFixAddress}
            accessibilityRole="button"
            className="mt-3 h-11 items-center justify-center rounded-xl bg-primary-fill px-4"
          >
            <Text className="text-[14px] font-bold text-text-on-primary">
              Set delivery address
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (loading) {
    // A skeleton rather than a spinner in place of the number: the row keeps
    // its shape, so the total below it doesn't jump when the fee lands.
    return (
      <View className="mt-4 rounded-xl bg-surface-sunken p-4">
        <View className="flex-row items-center gap-2">
          <Truck size={18} color={t.textSecondary} />
          <Text className="flex-1 text-[13px] text-text-secondary">
            Working out your delivery fee…
          </Text>
          <ActivityIndicator size="small" color={t.textSecondary} />
        </View>
        <View className="mt-3 h-4 w-2/3 rounded bg-surface-raised" />
      </View>
    );
  }

  if (!quote) return null;

  return (
    <View className="mt-4 rounded-xl bg-surface-sunken p-4">
      <View className="flex-row items-center">
        <Truck size={18} color={t.textSecondary} />
        <Text className="ml-2 flex-1 text-[15px] font-semibold text-text-primary">
          Delivery
        </Text>
        <Text className="text-[15px] font-bold text-text-primary">
          {money(quote.fee_minor)}
        </Text>
      </View>

      <Text className="mt-1 text-[12px] text-text-muted">
        About {quote.distance_km.toFixed(1)} km
        {quote.precision === "approximate" ? " · based on your saved address" : ""}
      </Text>

      {quote.breakdown?.lines?.length ? (
        <>
          <TouchableOpacity
            onPress={() => setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={open ? "Hide fee breakdown" : "Show fee breakdown"}
            className="mt-2 flex-row items-center gap-1"
          >
            <Text className="text-[12px] font-semibold text-text-secondary">
              {open ? "Hide" : "How is this worked out?"}
            </Text>
            {open ? (
              <ChevronUp size={14} color={t.textSecondary} />
            ) : (
              <ChevronDown size={14} color={t.textSecondary} />
            )}
          </TouchableOpacity>

          {open ? (
            <View className="mt-2 gap-1">
              {quote.breakdown.lines.map((line, i) => (
                <View key={`${line.label}-${i}`} className="flex-row justify-between">
                  <Text className="text-[12px] text-text-secondary">{line.label}</Text>
                  <Text className="text-[12px] text-text-secondary">
                    {money(line.amount_minor)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
