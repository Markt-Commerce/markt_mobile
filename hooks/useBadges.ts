import { useState, useEffect, useCallback } from "react";
import { getUserBadges } from "../services/sections/gamification";
import type { UserBadge } from "../types/gamification";

/**
 * A user's badge grid: the full active catalog with earned/locked state and
 * progress on locked badges (GET /gamification/users/{id}/badges).
 */
export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUserBadges(userId);
      setBadges(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { badges, loading, error, refresh };
}
