import { useState, useEffect, useCallback, useRef } from "react";
import { getLeaderboard } from "../services/sections/gamification";
import type {
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardScope,
  LeaderboardPeriod,
} from "../types/gamification";

function dedupe(rows: LeaderboardRow[]): LeaderboardRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.user_id)) return false;
    seen.add(r.user_id);
    return true;
  });
}

/**
 * Paginated leaderboard for a scope (global/buyers/sellers) and period
 * (all-time/weekly). Changing scope/period resets and refetches.
 */
export function useLeaderboard(
  initialScope: LeaderboardScope = "global",
  initialPeriod: LeaderboardPeriod = "weekly"
) {
  const [scope, setScope] = useState<LeaderboardScope>(initialScope);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [yourRank, setYourRank] = useState<LeaderboardRank | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const fetchPage = useCallback(
    async (reset: boolean, atCursor: number | null) => {
      if (busy.current) return;
      busy.current = true;
      reset ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const res = await getLeaderboard({
          scope,
          period,
          cursor: reset ? null : atCursor,
        });
        setRows((prev) => (reset ? res.items : dedupe([...prev, ...res.items])));
        setYourRank(res.your_rank);
        setCursor(res.next_cursor);
        setHasMore(res.next_cursor != null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        busy.current = false;
      }
    },
    [scope, period]
  );

  // Reset + refetch whenever scope/period changes.
  useEffect(() => {
    setRows([]);
    setCursor(null);
    setHasMore(true);
    fetchPage(true, null);
  }, [scope, period, fetchPage]);

  const refresh = useCallback(() => fetchPage(true, null), [fetchPage]);
  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    fetchPage(false, cursor);
  }, [hasMore, loading, loadingMore, cursor, fetchPage]);

  return {
    scope,
    period,
    setScope,
    setPeriod,
    rows,
    yourRank,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
  };
}
