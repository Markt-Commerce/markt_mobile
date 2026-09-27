import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { OrderTracking } from "../models/orders";
import { trackOrder } from "../services/sections/orders";
import { onNotificationsChanged } from "../utils/notificationEvents";

/** One cache entry for an order's tracking, shared by every screen that
 *  wants it.
 *
 *  The order detail screen and the track screen both want to say where
 *  the parcel is and who has it, and both used to fetch on their own with
 *  useState/useEffect -- so opening one after the other made the same
 *  call twice and the two could disagree on screen. They read the same
 *  key now, and one refetch updates both.
 */
export function orderTrackingKey(orderId: string) {
  return ["order-tracking", orderId] as const;
}

/** Whether this order is in someone's hands right now.
 *
 *  Only a delivery still moving is worth polling for; a delivered or
 *  cancelled order will not change again and does not need waking the
 *  radio every half minute.
 */
function isInFlight(tracking?: OrderTracking | null): boolean {
  const step = tracking?.delivery?.logistical_status;
  if (!tracking?.delivery) return false;
  return step !== "COMPLETED";
}

export function useOrderTracking(orderId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: orderTrackingKey(orderId ?? ""),
    queryFn: () => trackOrder(orderId as string),
    enabled: !!orderId,
    // A rider moves through five steps in under an hour. Thirty seconds
    // of staleness is the difference between "on the way" and someone
    // standing at the door.
    staleTime: 15_000,
    refetchInterval: (q) => (isInFlight(q.state.data) ? 30_000 : false),
    refetchOnWindowFocus: true,
  });

  // The rider's own app is what moves this forward, so nothing the buyer
  // does here can invalidate it -- the signal arrives as a push. Every
  // delivery step now sends one (see markt_python's
  // DeliveryService._notify_delivery_progress), and a push landing while
  // this screen is open means the answer on screen is already old.
  useEffect(() => {
    if (!orderId) return;
    return onNotificationsChanged(() => {
      queryClient.invalidateQueries({ queryKey: orderTrackingKey(orderId) });
    });
  }, [orderId, queryClient]);

  return query;
}
