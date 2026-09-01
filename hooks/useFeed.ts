import { useState, useCallback, useRef, useEffect } from "react";
import type { FeedItem } from "../types/feed";
import {
  getForYouFeed,
  getDiscoverFeed,
  getTrendingFeed,
  getFollowingFeed,
  getNicheFeed,
} from "../services/sections/feedApi";
import { friendlyErrorMessage } from "../utils/errorMessages";

// 10 keeps first paint light and makes infinite scroll engage while the
// platform's content volume is still small.
const PER_PAGE = 10;

// How long a cached tab stays good enough to show without refetching. Switching
// tabs back and forth inside this window is instant; past it the tab silently
// revalidates behind the content that's already on screen.
const STALE_AFTER_MS = 2 * 60 * 1000;

function deduplicateById(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const MAIN_TABS = {
  for_you: getForYouFeed,
  discover: getDiscoverFeed,
  trending: getTrendingFeed,
  following: getFollowingFeed,
} as const;

interface CacheEntry {
  items: FeedItem[];
  page: number;
  hasNext: boolean;
  fetchedAt: number;
}

const cache: Record<string, CacheEntry> = {};

/** Tab is either a main tab id or a niche id string for niche feed (NICHES_API §2.1). */
export function useFeed(tab: keyof typeof MAIN_TABS | string) {
  const cached = cache[tab];
  const [items, setItems] = useState<FeedItem[]>(cached?.items ?? []);
  const [hasNext, setHasNext] = useState(cached?.hasNext ?? true);
  // Distinguished so the list can show a centered spinner on a cold tab but
  // the pull-to-refresh control on a manual refresh. Previously both used one
  // `loading` flag, which made the refresh spinner appear on first paint.
  const [initialLoading, setInitialLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(cached?.page ?? 1);
  const itemsRef = useRef<FeedItem[]>(cached?.items ?? []);
  const hasNextRef = useRef(cached?.hasNext ?? true);
  const inFlightRef = useRef(false);
  const loadingMoreRef = useRef(false);
  // Switching tabs mid-request must not let the old tab's response overwrite
  // the new tab's list. Every response checks it is still the newest request
  // for the tab that is still selected before touching state.
  const requestSeqRef = useRef(0);
  const tabRef = useRef(tab);

  const fetchPage = useCallback(
    (page: number, forceRefresh: boolean) =>
      tab in MAIN_TABS
        ? (MAIN_TABS[tab as keyof typeof MAIN_TABS] as typeof getForYouFeed)({
            page,
            per_page: PER_PAGE,
            force_refresh: forceRefresh && tab === "for_you",
          })
        : getNicheFeed(tab, { page, per_page: PER_PAGE }),
    [tab]
  );

  const commit = useCallback(
    (next: FeedItem[], page: number, morePages: boolean) => {
      itemsRef.current = next;
      pageRef.current = page;
      hasNextRef.current = morePages;
      setItems(next);
      setHasNext(morePages);
      cache[tabRef.current] = {
        items: next,
        page,
        hasNext: morePages,
        fetchedAt: Date.now(),
      };
    },
    []
  );

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const seq = ++requestSeqRef.current;
      const forTab = tabRef.current;

      // The list is deliberately NOT cleared here. Blanking it made every row
      // unmount and flashed the empty state between the tap and the response.
      if (!opts.silent) {
        if (itemsRef.current.length === 0) setInitialLoading(true);
        else setRefreshing(true);
      }
      setError(null);

      try {
        const res = await fetchPage(1, true);
        if (seq !== requestSeqRef.current || forTab !== tabRef.current) return;
        commit(deduplicateById(res.items), 1, res.pagination.has_next);
      } catch (e) {
        if (seq !== requestSeqRef.current || forTab !== tabRef.current) return;
        // 401 redirects to login via the api layer — no error banner/toast needed.
        if ((e as { status?: number })?.status !== 401)
          setError(
            friendlyErrorMessage(e, "Could not load the feed. Pull down to try again.")
          );
      } finally {
        if (seq === requestSeqRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
        }
        inFlightRef.current = false;
      }
    },
    [fetchPage, commit]
  );

  /** Pull-to-refresh: always hits the network and shows the refresh control. */
  const refresh = useCallback(() => load(), [load]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || inFlightRef.current || !hasNextRef.current) return;
    loadingMoreRef.current = true;
    const seq = requestSeqRef.current;
    const forTab = tabRef.current;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetchPage(nextPage, false);
      if (seq !== requestSeqRef.current || forTab !== tabRef.current) return;
      const existing = new Set(itemsRef.current.map((i) => i.id));
      const merged = [
        ...itemsRef.current,
        ...res.items.filter((i) => !existing.has(i.id)),
      ];
      commit(merged, nextPage, res.pagination.has_next);
    } catch (e) {
      if (seq !== requestSeqRef.current || forTab !== tabRef.current) return;
      if ((e as { status?: number })?.status !== 401)
        setError(
          friendlyErrorMessage(e, "Could not load more posts. Please try again.")
        );
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [fetchPage, commit]);

  // Owning the tab-change fetch here means the screen no longer needs its own
  // effect calling refresh(), which used to fire on every mount and discard
  // whatever the cache had just seeded.
  useEffect(() => {
    tabRef.current = tab;
    const entry = cache[tab];
    itemsRef.current = entry?.items ?? [];
    pageRef.current = entry?.page ?? 1;
    hasNextRef.current = entry?.hasNext ?? true;
    setItems(entry?.items ?? []);
    setHasNext(entry?.hasNext ?? true);
    setError(null);

    if (!entry) {
      setInitialLoading(true);
      load();
    } else if (Date.now() - entry.fetchedAt > STALE_AFTER_MS) {
      // Cached content shows immediately; the refetch happens underneath it.
      setInitialLoading(false);
      load({ silent: true });
    } else {
      setInitialLoading(false);
    }
  }, [tab, load]);

  return {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    hasNext,
    error,
    refresh,
    loadMore,
  };
}
