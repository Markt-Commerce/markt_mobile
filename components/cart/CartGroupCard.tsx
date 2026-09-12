import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ChevronDown, ChevronUp, Store, Truck } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";
import type { CartGroup } from "../../models/cart";

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
  group: CartGroup;
  /** Where this order is going, already chosen. */
  deliveringTo?: string | null;
  /** The fee for this group once quoted, in naira. */
  deliveryFee?: number | null;
  /** Set when this group cannot be delivered to the chosen address. */
  blockedReason?: string | null;
  busy?: boolean;
  onCheckout: () => void;
  onClear: () => void;
  onChangeAddress: () => void;
  children?: React.ReactNode;
}

/**
 * One shop's card in the basket.
 *
 * A delivery quote prices one pickup to one dropoff, so a basket spanning two
 * shops is two orders — and showing it as one list let a buyer build a cart
 * that could never be paid for. Each card checks out on its own.
 */
export default function CartGroupCard({
  group, deliveringTo, deliveryFee, blockedReason, busy,
  onCheckout, onClear, onChangeAddress, children,
}: Props) {
  const t = useTokens();
  const [open, setOpen] = React.useState(false);
  const blocked = !!blockedReason;

  return (
    <View className="mb-4 rounded-2xl border border-border bg-surface-raised p-4">
      <View className="flex-row items-center">
        {group.banner_url ? (
          <Image
            source={{ uri: group.banner_url }}
            className="h-10 w-10 rounded-full"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken">
            <Store size={18} color={t.textSecondary} />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="text-[16px] font-bold text-text-primary" numberOfLines={1}>
            {group.shop_name || "This shop"}
          </Text>
          <Text className="mt-0.5 text-[13px] text-text-secondary">
            {group.item_count} item{group.item_count === 1 ? "" : "s"} · {money(group.subtotal)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={open ? "Hide items" : "View selection"}
          className="flex-row items-center gap-1 pl-2"
        >
          <Text className="text-[13px] font-bold text-primary-text">
            {open ? "Hide" : "View selection"}
          </Text>
          {open ? <ChevronUp size={16} color={t.primaryText} /> : <ChevronDown size={16} color={t.primaryText} />}
        </TouchableOpacity>
      </View>

      {open ? <View className="mt-3 border-t border-border pt-3">{children}</View> : null}

      <View className="mt-4 border-t border-border pt-3">
        <TouchableOpacity
          onPress={onChangeAddress}
          accessibilityRole="button"
          accessibilityLabel="Change delivery address"
          className="flex-row items-start gap-2"
        >
          <Truck size={16} color={t.textSecondary} />
          <Text className="flex-1 text-[13px] leading-5 text-text-secondary">
            {deliveringTo ? (
              <>Delivering to <Text className="text-text-primary">{deliveringTo}</Text></>
            ) : (
              <Text className="text-primary-text">Choose a delivery address</Text>
            )}
          </Text>
        </TouchableOpacity>

        {blocked ? (
          <View className="mt-3 rounded-xl border border-warning bg-surface-sunken p-3">
            <Text className="text-[13px] leading-5 text-text-secondary">{blockedReason}</Text>
          </View>
        ) : deliveryFee != null ? (
          <View className="mt-2 flex-row justify-between">
            <Text className="text-[13px] text-text-secondary">Delivery</Text>
            <Text className="text-[13px] text-text-primary">{money(deliveryFee)}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onCheckout}
        disabled={busy || blocked || !deliveringTo}
        accessibilityRole="button"
        className={`mt-4 h-12 items-center justify-center rounded-xl ${
          busy || blocked || !deliveringTo ? "bg-surface-sunken" : "bg-primary-fill"
        }`}
      >
        <Text
          className={`text-[15px] font-bold ${
            busy || blocked || !deliveringTo ? "text-text-muted" : "text-text-on-primary"
          }`}
        >
          {busy ? "Working…" : blocked ? "Can't deliver here" : "Checkout"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClear} accessibilityRole="button" className="mt-2 h-10 items-center justify-center">
        <Text className="text-[14px] font-semibold text-primary-text">Clear selection</Text>
      </TouchableOpacity>
    </View>
  );
}
