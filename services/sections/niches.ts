import { request, BASE_URL } from "../api";
import {
  Niches,
  NichesResponse,
  MyNichesResponse,
  CreateNicheRequest,
  NichePostsResponse,
  NichesListParams,
  NicheCanPostResponse,
} from "../../models/niches";
import { CreatePostRequest } from "../../models/post";

/**
 * GET /socials/niches — discover communities (NICHES_API §1.1).
 * Supports search, category filter, visibility.
 */
export async function getNiches(params: NichesListParams = {}): Promise<NichesResponse> {
  const { search, category_ids, visibility, page = 1, per_page = 20 } = params;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("per_page", String(per_page));
  if (search?.trim()) q.set("search", search.trim());
  if (category_ids?.length) q.set("category_ids", category_ids.join(","));
  if (visibility) q.set("visibility", visibility);
  const res = await request<NichesResponse>(`${BASE_URL}/socials/niches?${q}`, { method: "GET" });
  return res;
}

/**
 * GET /socials/niches/<id> — niche detail (NICHES_API §1.2).
 */
export async function getNicheById(id: string): Promise<Niches> {
  const res = await request<Niches>(`${BASE_URL}/socials/niches/${id}`, { method: "GET" });
  return res;
}

/**
 * GET /socials/niches/<id>/can-post — check if user can create posts (NICHES_API §1.6).
 */
export async function canPostInNiche(nicheId: string): Promise<NicheCanPostResponse> {
  const res = await request<NicheCanPostResponse>(
    `${BASE_URL}/socials/niches/${nicheId}/can-post`,
    { method: "GET" }
  );
  return res;
}

export async function createNiche(data: CreateNicheRequest): Promise<void> {
  await request<void>(`${BASE_URL}/socials/niches`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function joinNiche(niche_id: string): Promise<void> {
  await request<void>(`${BASE_URL}/socials/niches/${niche_id}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function leaveNiche(niche_id: string): Promise<void> {
  await request<void>(`${BASE_URL}/socials/niches/${niche_id}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getNichePosts(niche_id: string, page = 1, perPage = 10): Promise<NichePostsResponse> {
  const res = await request<NichePostsResponse>(
    `${BASE_URL}/socials/niches/${niche_id}/posts?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  return res;
}

export async function createNichePost(niche_id: string, data: CreatePostRequest): Promise<void> {
  await request<void>(`${BASE_URL}/socials/niches/${niche_id}/posts`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * GET /socials/my-niches — user's joined niches (NICHES_API §1.8).
 * Returns memberships with nested niche. Use items[].niche for feed chips.
 */
export async function getMyNiches(
  page = 1,
  perPage = 10,
  search?: string
): Promise<MyNichesResponse> {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("per_page", String(perPage));
  if (search?.trim()) q.set("search", search.trim());
  const res = await request<MyNichesResponse>(`${BASE_URL}/socials/my-niches?${q}`, {
    method: "GET",
  });
  return res;
}