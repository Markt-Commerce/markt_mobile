/**
 * Maps a push notification's `data` payload (type/reference_type/reference_id --
 * see PushService.send_to_user in markt_python's app/notifications/tasks.py) to a
 * concrete in-app route. Driven by `reference_type`, not `type`, wherever a
 * notification type can carry more than one reference shape (e.g. OFFER_REJECTED
 * fires with reference_type "request" in one call site and "offer" in another --
 * see app/requests/services.py) -- no screen exists for a bare offer id, so that
 * case intentionally falls through to the notifications list.
 *
 * Returns null for types with no dedicated screen (falls back to the Alerts list,
 * where every notification is at least visible and, for the two types with an
 * actionable in-app prompt, actionable).
 */

export interface NotificationDeepLinkData {
  type?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  /** The order's status, sent with order notifications. */
  status?: string | null;
}

/** Statuses where the order is still moving, so tracking is the useful screen. */
const IN_FLIGHT_STATUSES = ["ready_for_delivery", "shipped"];

export function resolveNotificationRoute(data: NotificationDeepLinkData): string | null {
  const { type, reference_type, reference_id, status } = data;
  if (!reference_id) return null;

  // Pending buyer decisions (9.1, 10.3) -- the action is inline in the
  // notifications list itself (see app/notifications.tsx), not a separate
  // screen, so route there rather than to the order/allocation directly.
  if (type === "substitution_approval_required" || type === "thin_volume_delivery_choice") {
    return "/notifications";
  }

  if (type === "payment_success") {
    return `/checkout/payment-result?payment_id=${reference_id}&status=success`;
  }
  if (type === "payment_failed") {
    return `/checkout/payment-result?payment_id=${reference_id}&status=failed`;
  }

  switch (reference_type) {
    case "order":
      // Delivery-progress-shaped events land on tracking; everything else
      // (cancellation, refund) lands on the order summary.
      //
      // An order_update carries the status it is announcing. "It is packed"
      // and "a rider has it" are what people open to ask where the order is,
      // so those go to tracking; delivered and the terminal states go to the
      // summary, where the receipt and the return option are.
      if (type === "delivery_failed") return `/orders/${reference_id}/track`;
      if (type === "order_update" && status && IN_FLIGHT_STATUSES.includes(status)) {
        return `/orders/${reference_id}/track`;
      }
      return `/orderdetail/${reference_id}`;
    case "post":
      return `/postDetails/${reference_id}`;
    case "product":
      return `/productDetails/${reference_id}`;
    case "request":
      return `/requestDetails/${reference_id}`;
    case "niche":
      return `/niches/${reference_id}`;
    case "order_item":
      // 7.3: ITEM_UNFULFILLED -- an item Markt couldn't find a
      // replacement seller for, awaiting the buyer's escalation choice.
      return `/orders/escalation/${reference_id}`;
    case "fulfilment_allocation":
      // 12.1-12.2: FULFILMENT_REQUEST / seller-facing pending-allocations
      // list -- not scoped to this one allocation id since the list
      // itself is small and the seller likely has other pending items
      // too; opening straight to the list is more useful than a
      // single-allocation detail view that doesn't otherwise exist.
      return "/fulfilment/allocations";
    default:
      // offer, review, user: no dedicated screen today.
      return null;
  }
}
