import { request, BASE_URL } from "../api";
import { NichesResponse, CreateNicheRequest } from "../../models/niches";

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