/**
 * Markets API — market browsing (13: click a market, see its sellers/products/posts).
 */

import { request } from "../api";
import type { Product, Post } from "../../models/feed";
import type { ShopsListResponse } from "./shops";

export interface Market {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  seller_count: number;
}

export interface MarketsResponse {
  markets: Market[];
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MarketProductsResponse {
  items: Product[];
  pagination: PaginationMeta;
}

export interface MarketPostsResponse {
  items: Post[];
  pagination: PaginationMeta;
}

function toQuery(params: { page?: number; per_page?: number }): string {
  const p = new URLSearchParams();
  if (params.page) p.set("page", String(params.page));
  if (params.per_page) p.set("per_page", String(params.per_page));
  const query = p.toString();
  return query ? `?${query}` : "";
}

/** List active markets */
export async function getMarkets(): Promise<MarketsResponse> {
  return request<MarketsResponse>("/markets/", { method: "GET" });
}

/** Single market */
export async function getMarket(marketId: number | string): Promise<Market> {
  return request<Market>(`/markets/${marketId}`, { method: "GET" });
}

/** Sellers assigned to a market — same shape as GET /users/shops */
export async function getMarketSellers(
  marketId: number | string,
  params: { page?: number; per_page?: number } = {},
): Promise<ShopsListResponse> {
  return request<ShopsListResponse>(
    `/markets/${marketId}/sellers${toQuery(params)}`,
    { method: "GET" },
  );
}

/** Products from sellers in a market — same shape as GET /products/ */
export async function getMarketProducts(
  marketId: number | string,
  params: { page?: number; per_page?: number } = {},
): Promise<MarketProductsResponse> {
  return request<MarketProductsResponse>(
    `/markets/${marketId}/products${toQuery(params)}`,
    { method: "GET" },
  );
}

/** Posts from sellers in a market — same shape as GET /socials/posts */
export async function getMarketPosts(
  marketId: number | string,
  params: { page?: number; per_page?: number } = {},
): Promise<MarketPostsResponse> {
  return request<MarketPostsResponse>(
    `/markets/${marketId}/posts${toQuery(params)}`,
    { method: "GET" },
  );
}
