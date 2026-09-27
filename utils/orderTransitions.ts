/**
 * Which statuses an order item can legally move to, mirroring
 * OrderItem.VALID_STATUS_TRANSITIONS in app/orders/models.py.
 *
 * The seller action menu used to offer every action from every state, so
 * "Mark Shipped" on a pending item was a guaranteed 422 -- the backend allows
 * PENDING to move only to PROCESSING or CANCELLED. Offering an action that
 * cannot succeed is worse than not offering it.
 *
 * Keep in step with the backend. If they disagree, the server wins and the
 * seller sees an error they could do nothing about.
 */

export type OrderItemStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * What a *seller* may do, which is narrower than what the item may become.
 *
 * "delivered" is deliberately absent even though PROCESSING and SHIPPED can
 * legally reach it: delivery is confirmed by the buyer or the rider through the
 * POD/QR flow, and the seller endpoint refuses it (marking it sets delivered_at,
 * which starts the settlement hold that pays the seller — self-declared delivery
 * would let a seller release their own escrow). Offering it would be offering an
 * action the server rejects.
 */
const TRANSITIONS: Record<string, OrderItemStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: [],
  delivered: [],
  cancelled: [],
};

/** Legal next statuses. Empty when the item has reached a terminal state. */
export function nextStatuses(current?: string | null): OrderItemStatus[] {
  const key = String(current ?? "").trim().toLowerCase();
  return TRANSITIONS[key] ?? [];
}

/** What the seller taps to make it happen. Partial: only the statuses a seller
 *  can actually set have an action label. */
export const STATUS_ACTION_LABEL: Partial<Record<OrderItemStatus, string>> = {
  processing: "Accept order",
  shipped: "Mark shipped",
  // "cancelled", with two Ls -- the menu used to send "canceled", which the
  // backend enum has never accepted.
  cancelled: "Cancel order",
  pending: "Mark pending",
};
