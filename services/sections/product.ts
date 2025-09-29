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
  // if wrapped in data.items
  const payload = (res as any).data ?? (res as any);
  return payload?.items ?? payload ?? [];
}


/**
 *
 */
export async function getProductById(productId: string): Promise<ProductDetail> {
  const res = await request<ApiResponse<ProductDetail>>(`${BASE_URL}/products/${productId}`, {
    method: "GET",
  });
  return (res as any).data ?? (res as any);
}