import { useState, useCallback, useRef } from "react";
import type { FeedItem, FeedTab } from "../types/feed";
import { getForYouFeed, getDiscoverFeed, getTrendingFeed, getFollowingFeed } from "../services/sections/feedApi";

const PER_PAGE = 20;

function deduplicateById(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
const FETCHERS = { for_you: getForYouFeed, discover: getDiscoverFeed, trending: getTrendingFeed, following: getFollowingFeed } as const;
const cache: Record<string, { items: FeedItem[]; page: number; hasNext: boolean }> = {};

export function useFeed(tab: keyof typeof FETCHERS) {
  const c = cache[tab];
  const [items, setItems] = useState<FeedItem[]>(c?.items ?? []);
  const [page, setPage] = useState(c?.page ?? 1);
  const [hasNext, setHasNext] = useState(c?.hasNext ?? true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setItems([]);
    setLoading(true);
    setError(null);
    try {
      const res = await FETCHERS[tab]({ page: 1, per_page: PER_PAGE, force_refresh: tab === "for_you" });
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
      const res = await FETCHERS[tab]({ page: nextPage, per_page: PER_PAGE });
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
