/**
 * Global search — MOBILE_HOME_FEED_API_CONTRACTS.md
 * GET /api/v1/search/?search=...&page=1&per_page=20
 */
import { SearchResponse } from "../../models/search";
import { request } from "../api";

export async function search(query: string, page = 1, perPage = 20): Promise<SearchResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(page),
    per_page: String(perPage),
  });
  return request<SearchResponse>(`/search?${params.toString()}`, { method: "GET" });
}
