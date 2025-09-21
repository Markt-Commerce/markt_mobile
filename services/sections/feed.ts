import { request, BASE_URL } from "../api";
import { Product, Post, BuyerRequest } from "../../models/feed";
import { ApiResponse } from "../../models/auth";

// Fetch products
export async function getProducts(page = 1, perPage = 10): Promise<Product[]> {
  const res = await request<{ items: Product[] }>(
    `${BASE_URL}/products?page=${page}&per_page=${perPage}`,
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

export async function getBuyerRequests(page = 1, perPage = 5): Promise<BuyerRequest[]> {
    const res = await request<{ items: BuyerRequest[] }>(
      `${BASE_URL}/requests?page=${page}&per_page=${perPage}`,
      { method: "GET" }
    );
    return res.items;
  }