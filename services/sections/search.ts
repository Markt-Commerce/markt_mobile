import { SearchResponse } from "../../models/search";
import { BASE_URL, request } from "../api";

export const search = async (query: string, page: number): Promise<SearchResponse> => {
  const response = await request<SearchResponse>(`${BASE_URL}/search?search=${query}&page=${page}`, {
    method: "GET",
  });
  return response;
};
