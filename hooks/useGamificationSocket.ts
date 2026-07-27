import { useEffect, useRef } from "react";
import { useUser } from "./userContextProvider";
import gamificationSocket from "../services/gamificationSock";
import type {
  PointsAwardedEvent,
  BadgeEarnedEvent,
  TierChangedEvent,
} from "../types/gamification";

export interface GamificationSocketHandlers {
  onPoints?: (e: PointsAwardedEvent) => void;
  onBadge?: (e: BadgeEarnedEvent) => void;
  onTier?: (e: TierChangedEvent) => void;
}

/**
 * Connects the gamification socket for the current user and dispatches the
 * three realtime events. Handlers are read through a ref so passing inline
 * callbacks doesn't re-subscribe on every render.
 */
export function useGamificationSocket(handlers: GamificationSocketHandlers) {
  const { user } = useUser();
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const userId = user?.user_id;
    if (!userId) return;

    gamificationSocket.connect(userId);
    const offs = [
      gamificationSocket.onPoints((e) => ref.current.onPoints?.(e)),
      gamificationSocket.onBadge((e) => ref.current.onBadge?.(e)),
      gamificationSocket.onTier((e) => ref.current.onTier?.(e)),
    ];
    return () => offs.forEach((off) => off());
  }, [user?.user_id]);
}
