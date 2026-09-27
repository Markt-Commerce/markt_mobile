import { BASE_URL,request } from "../api";

import { Category } from "../../models/categories";

export const getAllCategories = async (): Promise<Category[]> => {
  // NOTE: keep the trailing slash. The backend 308-redirects `/categories` ->
  // `http://.../categories/` (cleartext), which release Android APKs block by
  // default — so without the slash the list silently comes back empty in prod.
  const res = await request<Category[]>(`${BASE_URL}/categories/`,{
    method: "GET"
  });
  return res;
}