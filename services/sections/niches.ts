import { request, BASE_URL } from "../api";
import { NichesResponse, CreateNicheRequest, NichePostsResponse } from "../../models/niches";
import { CreatePostRequest } from "../../models/post";

// Fetch products
export async function getNiches(page = 1, perPage = 10): Promise<NichesResponse> {
  const res = await request<NichesResponse>(
    `${BASE_URL}/socials/niches?page=${page}&per_page=${perPage}`,
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

export async function getMyNiches(page = 1, perPage = 10, search: string): Promise<NichesResponse> {
  const res = await request<NichesResponse>(
    `${BASE_URL}/socials/users/my-niches?page=${page}&per_page=${perPage}&search=${search}`,
    { method: "GET" }
  );
  return res;
}