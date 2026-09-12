import React from "react";
import { Text, View } from "react-native";
import { formatPrice } from "../utils/money";

/**
 * A price, with the discount shown when there is one.
 *
 * "Compare at price" has been on the create-product form from the start and
 * nothing has ever rendered it — the value was collected, sent, stored, and
 * then never seen again by anyone. A seller marking something down had no way
 * to tell, and buyers were never shown the saving.
 *
 * The rule is `compare_at_price > price`, not merely "is set". Two reasons:
 * a seller can leave the field at whatever it was, and the create sheet used
 * to default the field to 0.01 when it was left blank — so a great many
 * existing products claim to have been 1 kobo before. Comparing the two
 * numbers is the only check that survives that data.
 */
export function discountPercent(
  price: number | string | null | undefined,
  compareAt: number | string | null | undefined
): number | null {
  const now = Number(price);
  const was = Number(compareAt);
  if (!Number.isFinite(now) || !Number.isFinite(was)) return null;
  if (was <= now || now <= 0) return null;

  const raw = ((was - now) / was) * 100;
  // Tested against the unrounded figure, not the rounded one. Rounding first
  // turns a 0.7% difference into "1% off", which is noise dressed as a sale.
  if (raw < 1) return null;
  // And clamped rather than rejected at the top: 99.5% rounds to 100, and
  // refusing that would hide the deepest discounts in the app. Nothing here
  // is free — `now <= 0` already returned above.
  return Math.min(99, Math.round(raw));
}

export default function Price({
  price,
  compareAt,
  size = "md",
  className = "",
}: {
  price: number | string | null | undefined;
  compareAt?: number | string | null;
  /** `sm` for tiles and rows, `md` for a product page. */
  size?: "sm" | "md";
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  const big = size === "md";

  if (off === null) {
    return (
      <Text
        className={`font-bold text-text-primary ${big ? "text-xl" : "text-[15px]"} ${className}`}
      >
        {formatPrice(price)}
      </Text>
    );
  }

  return (
    <View className={`flex-row items-center gap-2 flex-wrap ${className}`}>
      <Text className={`font-bold text-text-primary ${big ? "text-xl" : "text-[15px]"}`}>
        {formatPrice(price)}
      </Text>
      <Text
        className={`text-text-muted ${big ? "text-[15px]" : "text-[12px]"}`}
        style={{ textDecorationLine: "line-through" }}
        // Read out as words: a screen reader announcing a struck-through
        // number gives no hint that it is the old one.
        accessibilityLabel={`was ${formatPrice(compareAt)}`}
      >
        {formatPrice(compareAt)}
      </Text>
      <View
        className={`rounded-full bg-success-muted ${big ? "px-2.5 py-1" : "px-2 py-0.5"}`}
      >
        <Text
          className={`font-bold text-success-text ${big ? "text-[12px]" : "text-[11px]"}`}
        >
          {off}% off
        </Text>
      </View>
    </View>
  );
}
