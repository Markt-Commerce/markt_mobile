import { useState, useCallback, useRef } from "react";
import type { FeedItem } from "../types/feed";
import {
  getForYouFeed,
  getDiscoverFeed,
  getTrendingFeed,
  getFollowingFeed,
  getNicheFeed,
} from "../services/sections/feedApi";

const PER_PAGE = 20;

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

const cache: Record<string, { items: FeedItem[]; page: number; hasNext: boolean }> = {};

/** Tab is either a main tab id or a niche id string for niche feed (NICHES_API §2.1). */
export function useFeed(tab: keyof typeof MAIN_TABS | string) {
  const c = cache[tab];
  const [items, setItems] = useState<FeedItem[]>(c?.items ?? []);
  const [page, setPage] = useState(c?.page ?? 1);
  const [hasNext, setHasNext] = useState(c?.hasNext ?? true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const fetcher =
    tab in MAIN_TABS
      ? (params: { page: number; per_page: number; force_refresh?: boolean }) =>
          (MAIN_TABS[tab as keyof typeof MAIN_TABS] as typeof getForYouFeed)(params)
      : (params: { page: number; per_page: number }) =>
          getNicheFeed(tab, { ...params });

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setItems([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({
        page: 1,
        per_page: PER_PAGE,
        force_refresh: tab === "for_you",
      });
      const deduped = deduplicateById(res.items);
      setItems(deduped);
      setPage(1);
      setHasNext(res.pagination.has_next);
      cache[tab] = { items: deduped, page: 1, hasNext: res.pagination.has_next };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [tab]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loadingRef.current || !hasNext) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const res = await fetcher({ page: nextPage, per_page: PER_PAGE });
      const existingIds = new Set(items.map((i) => i.id));
      const uniqueNew = res.items.filter((i) => !existingIds.has(i.id));
      const newItems = deduplicateById([...items, ...uniqueNew]);
      setItems(newItems);
      setPage(nextPage);
      setHasNext(res.pagination.has_next);
      cache[tab] = { items: newItems, page: nextPage, hasNext: res.pagination.has_next };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [tab, page, hasNext, items]);

  return { items, loading, loadingMore, hasNext, error, refresh, loadMore };
}
