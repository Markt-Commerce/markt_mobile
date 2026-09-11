/**
 * Shops API
 * Trending shops for strip, list/search, detail, categories, follow.
 */

import { request } from "../api";

export interface ShopUser {
  id: string;
  username: string;
  profile_picture: string | null;
}

export interface ShopCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ShopStats {
  product_count: number;
  post_count: number;
  follower_count: number;
}

export interface ShopLite {
  id: number;
  shop_name: string;
  shop_slug: string;
  description: string | null;
  categories: ShopCategory[];
  total_rating: number;
  total_raters: number;
  average_rating: number;
  user: ShopUser;
  verification_status?: string;
  is_followed?: boolean;
  stats?: ShopStats;

  /** The shop's cover image. Null until the seller uploads one. */
  banner_url?: string | null;

  /**
   * Distance from the coordinates the request carried, in km.
   *
   * Null when the request had no location, or when this shop has none — most
   * sellers do not yet. A missing distance is not zero, and must never be
   * rendered as "0.0 km away".
   */
  distance_km?: number | null;
}

/** How the server scoped a proximity search, echoed back so the UI can say so. */
export interface ShopsLocationInfo {
  /** False when no usable coordinates were sent, or nothing was in range. */
  applied: boolean;
  /**
   * The tightest rung of the fallback ladder that contains every result
   * (10 / 50 / 200 km). Null when the list is not distance-restricted.
   */
  radius_km: number | null;
}

export interface ShopDetail extends ShopLite {
  is_active: boolean;
  policies: Record<string, unknown>;
  stats: ShopStats;
  recent_products: Array<{ id: string; name: string; price: number; image: string | null }>;
  recent_posts: Array<{
    id: string;
    caption: string;
    media: Array<{ url: string; type: string; alt_text: string | null }>;
    likes_count: number;
    comments_count: number;
    created_at: string;
  }>;
  is_followed: boolean;
  can_follow: boolean;
}

export interface ShopsResponse {
  shops: ShopLite[];
}

export interface ShopsListResponse extends ShopsResponse {
  /** Present on every list response; `applied: false` when not distance-scoped. */
  location?: ShopsLocationInfo;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ShopCategoriesResponse {
  categories: ShopCategory[];
}

/** Trending shops for the Instagram-style strip */
export async function getTrendingShops(): Promise<ShopsResponse> {
  return request<ShopsResponse>("/users/shops/trending", { method: "GET" });
}

/** List/search shops for Discover screen */
export async function getShops(params: {
  page?: number;
  per_page?: number;
  search?: string;
  active_only?: boolean;
  verified_only?: boolean;
  category?: string;
  sort_by?: "rating" | "name" | "recent" | "followers" | "nearby";
  /**
   * Where the shopper is. Sent as a pair or not at all — the backend refuses
   * a lone coordinate, and treats (0, 0) as a failed geocode rather than a
   * location. `sort_by: "nearby"` without them falls back to rating rather
   * than erroring, so a denied permission does not break browsing.
   */
  latitude?: number;
  longitude?: number;
} = {}): Promise<ShopsListResponse> {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.per_page) p.set("per_page", String(params.per_page ?? 20));
  if (params.search) p.set("search", params.search);
  if (params.active_only) p.set("active_only", "true");
  if (params.verified_only) p.set("verified_only", "true");
  if (params.category) p.set("category", params.category);
  if (params.sort_by) p.set("sort_by", params.sort_by);
  if (
    typeof params.latitude === "number" &&
    typeof params.longitude === "number"
  ) {
    p.set("latitude", String(params.latitude));
    p.set("longitude", String(params.longitude));
  }
  const query = p.toString();
  return request<ShopsListResponse>(`/users/shops${query ? `?${query}` : ""}`, { method: "GET" });
}

/** Shop categories for filters */
export async function getShopCategories(): Promise<ShopCategoriesResponse> {
  return request<ShopCategoriesResponse>("/users/shops/categories", { method: "GET" });
}

/** Shop detail for seller profile */
export async function getShopDetail(shopId: number | string): Promise<ShopDetail> {
  return request<ShopDetail>(`/users/shops/${shopId}`, { method: "GET" });
}
