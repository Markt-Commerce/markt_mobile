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

const TRANSITIONS: Record<string, OrderItemStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Legal next statuses. Empty when the item has reached a terminal state. */
export function nextStatuses(current?: string | null): OrderItemStatus[] {
  const key = String(current ?? "").trim().toLowerCase();
  return TRANSITIONS[key] ?? [];
}

/** What the seller taps to make it happen. */
export const STATUS_ACTION_LABEL: Record<OrderItemStatus, string> = {
  processing: "Accept order",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  // "cancelled", with two Ls -- the menu used to send "canceled", which the
  // backend enum has never accepted.
  cancelled: "Cancel order",
  pending: "Mark pending",
};
