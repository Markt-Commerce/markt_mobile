// /services/productService.ts
import { request, BASE_URL } from "../api";
import { CreateProductRequest, UpdateProductRequest, ProductResponse, Product, ProductDetail } from "../../models/products";
import { emitBadgeChanged } from "../../utils/badgeEvents";
import { ApiResponse } from "../../models/auth";

/**
 * Create a new product (seller only)
 */
export async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
  // Trailing slash: `/products` 308-redirects to cleartext http, which release
  // Android blocks — and a redirected POST can drop its body anyway.
  const res = await request<ApiResponse<ProductResponse>>(`${BASE_URL}/products/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log("createProduct response:", res);
  return (res as any).data ?? (res as any);
}

/**
 * Update a product (owner only) — PUT /products/<id>.
 *
 * The backend has supported this since products existed; the app only ever
 * called createProduct and deleteProduct, so a seller whose price changed had
 * to delete the listing and rebuild it, losing its reviews and view count.
 *
 * Partial by design: the inventory screen edits price, stock and status, and
 * sending only those leaves images, variants and categories untouched.
 */
export async function updateProduct(
  productId: string,
  payload: UpdateProductRequest
): Promise<ProductResponse> {
  const res = await request<ApiResponse<ProductResponse>>(
    `${BASE_URL}/products/${productId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  emitBadgeChanged();
  return (res as any).data ?? (res as any);
}

/**
 * Helper: get products for a seller (used in the product picker)
 */
export async function getSellerProducts(sellerId: number, page = 1, per_page = 20): Promise<ProductResponse[]> {
  const res = await request<ApiResponse<{ items: ProductResponse[] }>>(
    `${BASE_URL}/products/?seller_id=${sellerId}&page=${page}&per_page=${per_page}`,
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

/**
 * The public catalogue — GET /products/ requires no session.
 *
 * This is what makes guest browsing real rather than a teaser: someone can see
 * actual products and prices before deciding whether to create an account. The
 * personalised feed is a different endpoint and does require auth.
 */
export async function getPublicProducts(
  page = 1,
  per_page = 20
): Promise<ProductResponse[]> {
  const res = await request<ApiResponse<{ items: ProductResponse[] }>>(
    `${BASE_URL}/products/?page=${page}&per_page=${per_page}`,
    { method: "GET" }
  );
  const data: any = (res as any).data ?? res;
  return data?.items ?? data ?? [];
}
