import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { PodCode } from "../models/orders";
import { getPodCode } from "../services/sections/orders";
import { onNotificationsChanged } from "../utils/notificationEvents";

export function podCodeKey(orderId: string) {
  return ["pod-code", orderId] as const;
}

/** The buyer's delivery code, kept live while a rider is actually coming.
 *
 *  This screen is open at the exact moment a rider is scanning, so it is
 *  the one screen in the app that must not be a snapshot. It used to
 *  fetch once on mount, which meant that after the rider confirmed, the
 *  buyer went on being shown a QR code for a delivery that was over --
 *  and the gamification modal fired on top of it.
 */
export function usePodCode(orderId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: podCodeKey(orderId ?? ""),
    queryFn: () => getPodCode(orderId as string),
    enabled: !!orderId,
    staleTime: 5_000,
    // Only while a code is live. Once it is spent, or before a rider has
    // one, there is nothing to watch for.
    refetchInterval: (q) => (q.state.data?.ready ? 10_000 : false),
    refetchOnWindowFocus: true,
  });

  // The confirm happens on the rider's phone, so the push is the only
  // thing that can tell this screen it is finished.
  useEffect(() => {
    if (!orderId) return;
    return onNotificationsChanged(() => {
      queryClient.invalidateQueries({ queryKey: podCodeKey(orderId) });
    });
  }, [orderId, queryClient]);

  return query;
}

/** Whether to offer "View my delivery code" at all.
 *
 *  Shared by the track and order-detail screens so the link appears and
 *  disappears in both at the same moment.
 */
export function hasLiveDeliveryCode(pod?: PodCode | null): boolean {
  return !!pod?.ready && !pod?.delivered;
}
