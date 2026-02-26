/**
 * Feed API Types — Single source of truth
 *
 * These types match the exact request/response shapes for feed endpoints
 * (For You, Discover, Trending, Following, Niche) and ensure type safety
 * across the home screen implementation.
 */

// ---------------------------------------------------------------------------
// Feed item discriminants (use item.type to render Post vs Product)
// ---------------------------------------------------------------------------

/** Shared query params for all feed endpoints */
export interface FeedQueryParams {
  page?: number;
  per_page?: number;
  /** Main feed only: skip server cache and regenerate feed */
  force_refresh?: boolean;
}

/** Pagination metadata returned by all feed endpoints */
export interface FeedPagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ---------------------------------------------------------------------------
// Post item (item.type === "post")
// ---------------------------------------------------------------------------

export interface FeedPostUser {
  id: string;
  username: string;
  profile_picture: string | null;
}

export interface FeedPostMedia {
  url: string;
  type: string;
  platform?: string;
  post_type?: string;
  aspect_ratio?: string;
  optimized_for_platform?: boolean;
}

export interface FeedPostNiche {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  is_pinned: boolean;
  is_featured: boolean;
  niche_likes: number;
  niche_comments: number;
}

export interface FeedPost {
  id: string;
  type: "post";
  caption: string | null;
  user: FeedPostUser;
  media: FeedPostMedia[];
  likes_count: number;
  comments_count: number;
  /** true if current user liked this post — use for orange filled heart (API_CONTRACT_FEED_AND_FOLLOW §1.1). Fallback to likes_count > 0 if absent. */
  liked_by_me?: boolean;
  created_at: string;
  score?: number;
  niche: FeedPostNiche | null;
}

// ---------------------------------------------------------------------------
// Product item (item.type === "product")
// ---------------------------------------------------------------------------

export interface FeedProductImage {
  url: string;
  type: string;
  sort_order: number;
  is_featured: boolean;
  alt_text: string | null;
}

export interface FeedProductSellerUser {
  id: string;
  username: string;
  profile_picture: string | null;
}

export interface FeedProductSeller {
  id: number;
  shop_name: string;
  /** Follower count for this seller (API_CONTRACT_FEED_AND_FOLLOW §1.2). Default 0 if absent. */
  follower_count?: number;
  /** true if current user follows this seller — use for Follow vs Following (API_CONTRACT_FEED_AND_FOLLOW §1.2). Default false if absent. */
  is_followed?: boolean;
  user: FeedProductSellerUser;
}

export interface FeedProduct {
  id: string;
  type: "product";
  name: string;
  description: string | null;
  price: number;
  seller: FeedProductSeller;
  images: FeedProductImage[];
  rating: number;
  reviews_count: number;
  created_at: string;
  score?: number;
}

// ---------------------------------------------------------------------------
// Union type for feed items (discriminated by item.type)
// ---------------------------------------------------------------------------

export type FeedItem = FeedPost | FeedProduct;

export function isFeedPost(item: FeedItem): item is FeedPost {
  return item.type === "post";
}

export function isFeedProduct(item: FeedItem): item is FeedProduct {
  return item.type === "product";
}

// ---------------------------------------------------------------------------
// Feed API response
// ---------------------------------------------------------------------------

export interface FeedResponse {
  items: FeedItem[];
  pagination: FeedPagination;
}

// ---------------------------------------------------------------------------
// Tab → endpoint mapping (for use in API layer and UI)
// ---------------------------------------------------------------------------

export type FeedTab = "for_you" | "discover" | "trending" | "following" | "niche";
