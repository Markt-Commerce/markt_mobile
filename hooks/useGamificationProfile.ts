import { useState, useEffect, useCallback } from "react";
import { getMyGamification } from "../services/sections/gamification";
import { useUser } from "./userContextProvider";
import type { GamMe } from "../types/gamification";
import { friendlyErrorMessage } from "../utils/errorMessages";

/**
 * Current user's gamification stats (GET /gamification/me).
 * `bump` optimistically adjusts totals so a realtime points award shows
 * instantly before the refetch completes (spec §6.4).
 * No-ops while logged out so the provider can stay mounted across auth changes.
 */
export function useGamificationProfile() {
  const { user } = useUser();
  const loggedIn = !!user?.user_id;
  const [data, setData] = useState<GamMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!loggedIn) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getMyGamification());
    } catch (e) {
      setError(friendlyErrorMessage(e, "Could not load your rewards profile. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      setData(null);
      setError(null);
      return;
    }
    refresh();
  }, [loggedIn, refresh]);

  const bump = useCallback((delta: number) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            lifetime_points: prev.lifetime_points + delta,
            available_points: prev.available_points + delta,
            weekly_points: prev.weekly_points + delta,
          }
        : prev
    );
  }, []);

  return { data, loading, error, refresh, bump };
}
