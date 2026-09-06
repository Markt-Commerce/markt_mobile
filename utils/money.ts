/**
 * Money formatting, in one place.
 *
 * There were at least five local implementations of this across the app, all
 * slightly different, and one screen with none at all — the seller profile's
 * product tiles rendered `{product.price}` raw, so a ₦15,000 phone read as
 * "15000".
 *
 * Two functions rather than one because the distinction is real: a price chip
 * on a tile wants "₦15,000", while an order total wants "₦15,000.00". Rounding
 * a total would be wrong; showing kobo on a browse tile is noise.
 */

const CURRENCY = "₦";

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(n) ? n : 0;
}

/** A price as it appears while browsing: "₦15,000". No kobo. */
export function formatPrice(value: number | string | null | undefined): string {
  return `${CURRENCY}${Math.round(toNumber(value)).toLocaleString()}`;
}

/** A figure being paid or accounted for: "₦15,000.00". Kobo always shown. */
export function formatAmount(value: number | string | null | undefined): string {
  return `${CURRENCY}${toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
