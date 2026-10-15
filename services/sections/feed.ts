import { request, BASE_URL } from "../api";
import { Product, Post, BuyerRequest } from "../../models/feed";
import { ApiResponse } from "../../models/auth";
import type { FeedPost } from "../../types/feed";

// Fetch products
export async function getProducts(page = 1, perPage = 10): Promise<Product[]> {
  const res = await request<{ items: Product[] }>(
    // Trailing slash: `/products` 308-redirects to cleartext http (blocked in
    // release Android builds).
    `${BASE_URL}/products/?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  return res.items;
}

export async function getTrendingProducts(page = 1, perPage = 10): Promise<Product[]> {
  const res = await request<Product[]>(`${BASE_URL}/products/trending?page=${page}&per_page=${perPage}`, {
    method: "GET",
  });
  return res;
}

export async function getRecommendedProducts(page = 1, perPage = 10): Promise<Product[]> {
  const res = await request<Product[]>(`${BASE_URL}/products/recommended?page=${page}&per_page=${perPage}`, {
    method: "GET",
  });
  return res;
}

// Fetch posts
export async function getPosts(page = 1, perPage = 10): Promise<Post[]> {
  const res = await request<{ items: Post[] }>(
    `${BASE_URL}/socials/posts?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  return res.items;
}

/**
 * Posts for "Browse first", where there is no account.
 *
 * The feeds (`/socials/feed*`) are personalised and refuse a guest; the plain
 * post list is public. It sends the post-detail shape (`social_media` with a
 * nested media record, `like_count`), so it is mapped onto the FeedPost the
 * feed card already renders rather than teaching the card a second shape.
 */
export async function getPublicPosts(
  page = 1,
  perPage = 10
): Promise<{ items: FeedPost[]; hasMore: boolean }> {
  const res = await request<{
    items: any[];
    pagination?: { page: number; total_pages: number };
  }>(`${BASE_URL}/socials/posts?page=${page}&per_page=${perPage}`, { method: "GET" });
  const items: FeedPost[] = (res?.items ?? []).map((p) => ({
    id: p.id,
    type: "post",
    caption: p.caption ?? null,
    user: p.user,
    media: (p.social_media ?? [])
      .filter((sm: any) => !!sm?.media?.original_url)
      .map((sm: any) => ({
        url: sm.media.original_url,
        type: sm.media.media_type ?? sm.media.mime_type ?? "image",
      })),
    likes_count: p.likes_count ?? p.like_count ?? 0,
    comments_count: p.comments_count ?? p.comment_count ?? 0,
    liked_by_me: false,
    created_at: p.created_at,
    niche: null,
    products: p.products,
  }));
  const pg = res?.pagination;
  return { items, hasMore: pg ? pg.page < pg.total_pages : items.length === perPage };
}

export async function getBuyerRequests(page = 1, perPage = 5): Promise<BuyerRequest[]> {
    const res = await request<{ items: BuyerRequest[] }>(
      `${BASE_URL}/requests/?page=${page}&per_page=${perPage}`,
      { method: "GET" }
    );;
    return res.items;
  }