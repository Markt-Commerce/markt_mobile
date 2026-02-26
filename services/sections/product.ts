// /services/productService.ts
import { request, BASE_URL } from "../api";
import { CreateProductRequest, ProductResponse, Product, ProductDetail } from "../../models/products";
import { ApiResponse } from "../../models/auth";

/**
 * Create a new product (seller only)
 */
export async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
  const res = await request<ApiResponse<ProductResponse>>(`${BASE_URL}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // res may be ApiResponse<ProductResponse> like { data: {...} } depending on your API wrapper
  // if your request helper returns the actual object directly, adjust accordingly.
  return (res as any).data ?? (res as any);
}

/**
 * Helper: get products for a seller (used in the product picker)
 */
export async function getSellerProducts(sellerId: number, page = 1, per_page = 20): Promise<ProductResponse[]> {
  const res = await request<ApiResponse<{ items: ProductResponse[] }>>(
    `${BASE_URL}/products?seller_id=${sellerId}&page=${page}&per_page=${per_page}`,
    {
      method: "GET",
    }
  );
  const payload = (res as any).data ?? (res as any);
  return payload?.items ?? payload ?? [];
}

/**
 * Get current seller's products (chat attachment sheet).
 * Tries GET /api/v1/products/seller/my-products, falls back to getSellerProducts.
 */
export async function getMyProducts(page = 1, per_page = 20): Promise<ProductResponse[]> {
  try {
    const res = await request<ApiResponse<{ items?: ProductResponse[]; products?: ProductResponse[] }>>(
      `${BASE_URL}/products/seller/my-products?page=${page}&per_page=${per_page}`,
      { method: "GET" }
    );
    const payload = (res as any).data ?? (res as any);
    return payload?.items ?? payload?.products ?? payload ?? [];
  } catch {
    return [];
  }
}


/**
 *
 */
export async function getProductById(productId: string): Promise<ProductDetail> {
  const res = await request<ApiResponse<ProductDetail>>(`/products/${productId}`, {
    method: "GET",
  });
  return (res as any).data ?? (res as any);
}

/**
 * Track product view (analytics)
 * Call when user lands on product detail page.
 */
export async function trackProductView(productId: string): Promise<void> {
  await request(`/products/${productId}/view`, { method: "POST" });
}

/**
 * Delete product (seller only)
 */
export async function deleteProduct(productId: string): Promise<void> {
  await request(`${BASE_URL}/products/${productId}`, {
    method: "DELETE",
  });
}

/**
 * Review product (buyer only)
 */
export async function reviewProduct(productId: string, orderId: string, rating: number, title: string, comment: string): Promise<void> {
  await request(`${BASE_URL}/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ order_id: orderId, rating, content: comment, title}),
  });
}