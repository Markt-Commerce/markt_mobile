import { BASE_URL,request } from "../api";

import { Category } from "../../models/categories";

export const getAllCategories = async (): Promise<Category[]> => {
  const res = await request<Category[]>(`${BASE_URL}/categories`,{
    method: "GET"
  });
  return res;
}