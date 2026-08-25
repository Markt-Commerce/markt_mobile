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
}

export function resolveNotificationRoute(data: NotificationDeepLinkData): string | null {
  const { type, reference_type, reference_id } = data;
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
      return type === "delivery_failed"
        ? `/orders/${reference_id}/track`
        : `/orderdetail/${reference_id}`;
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
    default:
      // fulfilment_allocation (no seller-side screen yet -- see
      // Unfinished-Tasks.md), offer, review, user: no dedicated screen
      // today.
      return null;
  }
}
