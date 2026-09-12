/**
 * A discount offer, as it appears in the conversation.
 *
 * The server has been posting these as `message_type: "discount"` since the
 * feature existed. The app had branches for text, image, video, product and
 * "offer" (a buyer's price offer — a different thing) but none for this, so
 * a sent discount rendered an empty bubble: the seller saw "Offer sent" and
 * the buyer saw nothing at all.
 *
 * The seller's optional note is shown as their words, in quotes and apart
 * from the terms, rather than run together with the generated sentence.
 */
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Tag } from "lucide-react-native";
import { useTokens } from "../../theme/useTokens";

const money = (n: number) => {
  try {
    return Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(n || 0);
  } catch {
    return `₦${(n || 0).toFixed(2)}`;
  }
};

/** "in 3 days", "in 5 hours", "soon" — precise enough to act on, vague enough
 *  not to imply a countdown we aren't running. */
function expiresIn(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return "expired";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "expires soon";
  if (hours < 24) return `expires in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `expires in ${days} day${days === 1 ? "" : "s"}`;
}

export interface DiscountMessageData {
  discount_id?: number;
  discount_type?: "percentage" | "fixed_amount" | string;
  discount_value?: number;
  expires_at?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  minimum_order_amount?: number | null;
  discount_message?: string | null;
  status?: string | null;
}

interface Props {
  data: DiscountMessageData;
  /** The note, when an older message carried it only in the body text. */
  fallbackNote?: string | null;
  /** Live status, looked up from the room's discounts — the one in the
   *  message is the value at the moment it was sent. */
  status?: string | null;
  role?: "buyer" | "seller" | string;
  busy?: boolean;
  onRespond?: (discountId: number, response: "accepted" | "rejected") => void;
}

export default function DiscountMessageCard({
  data,
  fallbackNote,
  status,
  role,
  busy,
  onRespond,
}: Props) {
  const t = useTokens();
  const live = (status ?? data.status ?? "pending").toLowerCase();
  const value = Number(data.discount_value ?? 0);
  const headline =
    data.discount_type === "percentage"
      ? `${value}% off`
      : `${money(value)} off`;
  const scope = data.product_id
    ? data.product_name || "one item"
    : "anything in this shop";
  const note = (data.discount_message || fallbackNote || "").trim();
  const expiry = expiresIn(data.expires_at);
  const dead = live === "used" || live === "rejected" || live === "cancelled" || expiry === "expired";
  const canRespond =
    role === "buyer" &&
    !!data.discount_id &&
    !!onRespond &&
    !dead &&
    (live === "pending" || live === "active");

  return (
    <View
      className={`min-w-[220px] overflow-hidden rounded-xl border ${
        dead ? "border-border bg-surface-sunken" : "border-primary-fill bg-surface-raised"
      }`}
    >
      <View className="px-4 pt-3 pb-3">
        <View className="flex-row items-center gap-2">
          <Tag size={14} color={dead ? t.textMuted : t.primaryText} />
          <Text
            className={`text-[11px] font-bold uppercase tracking-wide ${
              dead ? "text-text-muted" : "text-primary-text"
            }`}
          >
            {live === "used"
              ? "Discount used"
              : live === "rejected"
                ? "Discount declined"
                : live === "cancelled"
                  ? "Discount withdrawn"
                  : expiry === "expired"
                    ? "Discount expired"
                    : live === "accepted"
                      ? "Discount accepted"
                      : "Discount offer"}
          </Text>
        </View>

        <Text
          className={`mt-1 text-[18px] font-bold ${
            dead ? "text-text-muted" : "text-text-primary"
          }`}
        >
          {headline}
        </Text>
        <Text className="mt-0.5 text-[13px] text-text-secondary">on {scope}</Text>

        {data.minimum_order_amount ? (
          <Text className="mt-1 text-[12px] text-text-muted">
            Minimum order {money(Number(data.minimum_order_amount))}
          </Text>
        ) : null}

        {note ? (
          // The seller's own words, kept apart from the terms above so it
          // reads as a message rather than as fine print.
          <Text className="mt-2 text-[13px] leading-5 text-text-primary">
            “{note}”
          </Text>
        ) : null}

        {expiry && expiry !== "expired" && !dead ? (
          <Text className="mt-2 text-[12px] text-text-muted">{expiry}</Text>
        ) : null}

        {live === "accepted" && !dead ? (
          <Text className="mt-2 text-[12px] text-text-secondary">
            Use it at checkout.
          </Text>
        ) : null}
      </View>

      {canRespond ? (
        <View className="flex-row gap-2 border-t border-border p-2">
          <TouchableOpacity
            onPress={() => onRespond!(data.discount_id!, "accepted")}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!busy, busy: !!busy }}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
              busy ? "bg-surface-sunken" : "bg-primary-fill"
            }`}
          >
            {busy ? <ActivityIndicator size="small" color={t.textSecondary} /> : null}
            <Text
              className={`text-[14px] font-bold ${
                busy ? "text-text-muted" : "text-text-on-primary"
              }`}
            >
              Accept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRespond!(data.discount_id!, "rejected")}
            disabled={busy}
            accessibilityRole="button"
            className="flex-1 items-center justify-center rounded-lg border border-border py-2.5"
          >
            <Text className="text-[14px] font-semibold text-text-secondary">
              No thanks
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
