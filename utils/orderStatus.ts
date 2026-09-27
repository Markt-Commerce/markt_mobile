/**
 * The order status vocabulary, in one place.
 *
 * The buyer's Ongoing tab used to filter on
 * `["pending_payment", "confirmed", "processing", "shipped"]` and Completed on
 * `["delivered", "completed"]`. Two of those five names — `confirmed` and
 * `completed` — are not statuses the backend can produce, and two that it does
 * produce, `ready_for_delivery` and `pending`, appeared in neither list. An
 * order in those states was filtered out of both tabs: paid for, visible in
 * the API, and invisible in the app.
 *
 * The real set, from OrderStatus in app/orders/models.py:
 *
 *   pending_payment  ready_for_delivery  pending (deprecated)  processing
 *   shipped  delivered  cancelled  returned  failed
 *
 * The lists below are written so that cannot happen again: ACTIVE is the
 * explicit set, and everything else is past. A status nobody here has heard of
 * shows up under Past rather than vanishing.
 */

/** Still moving: the buyer is waiting on something. */
export const ACTIVE_ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "processing",
  "ready_for_delivery",
  "shipped",
  "in_transit",
] as const;

export function isActiveOrder(status?: string | null): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(
    String(status ?? "").toLowerCase()
  );
}

/**
 * Everything else — delivered, but also cancelled, returned and failed.
 *
 * Defined as the complement rather than its own list. Those three finished
 * unhappily rather than "completed", but showing them under Past is right and
 * showing them nowhere is not, which is what a second hand-written list would
 * eventually do again.
 */
export function isPastOrder(status?: string | null): boolean {
  return !isActiveOrder(status);
}
