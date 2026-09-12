/** Delivery quoting — see markt_python/docs/ADR-001-delivery-quoting.md. */

/** A single line of the fee, in kobo. */
export interface DeliveryFeeLine {
  label: string;
  amount_minor: number;
}

export interface DeliveryBreakdown {
  total_minor: number;
  lines: DeliveryFeeLine[];
}

/**
 * A price we have committed to, for a short while.
 *
 * `fee_minor` is kobo, not naira: delivery prices in integer minor units end
 * to end so a fee split across several buyers divides without leaving a
 * fraction of a kobo unaccounted for. Divide by 100 only to display.
 */
export interface DeliveryQuote {
  id: string;
  fee_minor: number;
  breakdown: DeliveryBreakdown;
  distance_km: number;
  /** "approximate" until the buyer confirms the pin; the server records which. */
  precision: "approximate" | "confirmed";
  expires_at: string;
  strategy: string;
  strategy_version: string;
  /** Whether sharing a run is on offer. A deployment flag the client cannot
   * know on its own, and offering a choice that does not exist is worse than
   * not offering it. */
  batch_available?: boolean;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  city: string | null;
  zone: string | null;
}

export interface DeliveryQuoteRequest {
  seller_id: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  item_count?: number;
  total_weight_grams?: number;
  precision?: "approximate" | "confirmed";
}

/**
 * Why a quote could not be given. The server sends this on a 422 so the app
 * can say something specific instead of "something went wrong" — the two
 * unlocated cases are fixable by the user, the two unserviceable ones are not.
 */
export type NotServiceableReason =
  | "pickup_unlocated"
  | "dropoff_unlocated"
  | "pickup_not_serviceable"
  | "dropoff_not_serviceable"
  | "no_lane";

export interface NotServiceableError {
  error_type: "not_serviceable";
  reason: NotServiceableReason;
  message: string;
  city_known?: boolean;
  pickup_zone?: string;
  dropoff_zone?: string;
}
