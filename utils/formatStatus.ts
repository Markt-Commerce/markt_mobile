/**
 * Turn a backend enum value into something a person reads.
 *
 * Statuses arrive as snake_case straight off the Python enums —
 * `pending_payment`, `out_for_delivery` — and were being rendered raw, so the
 * order screen showed "Pending_Payment".
 *
 * Sentence case, not Title Case: "Pending payment" reads as English, while
 * "Pending Payment" reads like a column header.
 */

/** Statuses whose plain-English wording isn't just the enum with spaces in. */
const OVERRIDES: Record<string, string> = {
  pending_payment: "Awaiting payment",
  payment_failed: "Payment failed",
  out_for_delivery: "Out for delivery",
  ready_for_delivery: "Ready for delivery",
  partially_refunded: "Partially refunded",
  partially_fulfilled: "Partially fulfilled",
  awaiting_substitution_decision: "Awaiting your decision",
};

export function formatStatus(value?: string | null): string {
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  if (!key) return "";
  if (OVERRIDES[key]) return OVERRIDES[key];

  const spaced = key.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Colour intent for a status, so a chip can carry meaning without the reader
 * parsing the words. Kept deliberately coarse — three buckets, not a colour
 * per enum value.
 */
export type StatusTone = "positive" | "attention" | "negative" | "neutral";

export function statusTone(value?: string | null): StatusTone {
  const key = String(value ?? "").toLowerCase();
  if (!key) return "neutral";
  if (/deliver|complet|fulfil|paid|success|accept|active|open/.test(key)) {
    if (/fail|not|un/.test(key)) return "negative";
    return "positive";
  }
  if (/cancel|fail|reject|refund|expire|dispute/.test(key)) return "negative";
  if (/pending|await|process|hold|substitut/.test(key)) return "attention";
  return "neutral";
}
