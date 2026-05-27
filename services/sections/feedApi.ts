/**
 * Feed API Service — Single source of truth
 *
 * One function per feed endpoint. Use these exclusively for the home feed;
 * do NOT call /products and /posts separately for the main feed.
 */

import { request } from "../api";
import type {
  FeedResponse,
  FeedQueryParams,
} from "../../types/feed";

const FEED_BASE = "/socials/feed";
const PER_PAGE = 20;

function buildQuery(params: FeedQueryParams): string {
  const p = new URLSearchParams();
  p.set("page", String(params.page ?? 1));
  p.set("per_page", String(params.per_page ?? PER_PAGE));
  if (params.force_refresh === true) {
    p.set("force_refresh", "true");
  }
  return p.toString();
}

/**
 * For You — personalized main feed.
 * Supports force_refresh to bypass server cache on pull-to-refresh.
 */
export async function getForYouFeed(params: FeedQueryParams = {}): Promise<FeedResponse> {
  const query = buildQuery(params);
  return request<FeedResponse>(`${FEED_BASE}?${query}`, { method: "GET" });
}

/**
 * Discover — content tuned for discovery (new creators, categories).
 */
export async function getDiscoverFeed(params: FeedQueryParams = {}): Promise<FeedResponse> {
  const query = buildQuery(params);
  return request<FeedResponse>(`${FEED_BASE}/discover?${query}`, { method: "GET" });
}

/**
 * Trending — popular/trending content.
 */
export async function getTrendingFeed(params: FeedQueryParams = {}): Promise<FeedResponse> {
  const query = buildQuery(params);
  return request<FeedResponse>(`${FEED_BASE}/trending?${query}`, { method: "GET" });
}

/**
 * Following — content from users/sellers the current user follows.
 */
export async function getFollowingFeed(params: FeedQueryParams = {}): Promise<FeedResponse> {
  const query = buildQuery(params);
  return request<FeedResponse>(`${FEED_BASE}/following?${query}`, { method: "GET" });
}

/**
 * Niche — content limited to a single niche/community.
 */
export async function getNicheFeed(
  nicheId: string,
  params: FeedQueryParams = {}
): Promise<FeedResponse> {
  const query = buildQuery(params);
  return request<FeedResponse>(`${FEED_BASE}/niche/${nicheId}?${query}`, { method: "GET" });
}
