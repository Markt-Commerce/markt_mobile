// /services/productService.ts
import { request, BASE_URL } from "../api";
import { CreateProductRequest, UpdateProductRequest, ProductResponse, Product, ProductDetail } from "../../models/products";
import { emitBadgeChanged } from "../../utils/badgeEvents";
import { ApiResponse } from "../../models/auth";
import { Pagination } from "../../models/orders";

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
  const { items } = await getMyProductsPage(page, per_page);
  return items;
}

/**
 * The same call, keeping the pagination the server sends.
 *
 * `getMyProducts` threw it away and returned the items alone, so no caller
 * could know whether a second page existed — which is why the seller
 * dashboard asked for 50 products and simply hoped that covered it.
 *
 * Errors are not swallowed here. The old version returned `[]` on any
 * failure, which made a dropped request indistinguishable from an empty
 * inventory: the seller saw "no products" and had no reason to retry.
 */
export async function getMyProductsPage(
  page = 1,
  per_page = 20,
  filters: {
    /** Matches product name or SKU. */
    search?: string;
    /** One of the real ProductStatus values — `inactive` is not one. */
    status?: string;
    /** Only products below the server's low-stock threshold. */
    low_stock?: boolean;
  } = {}
): Promise<{ items: ProductResponse[]; pagination?: Pagination }> {
  const q = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
  });
  // Sent to the server rather than filtered here: the client only holds one
  // page, so filtering locally searches ten products and reports nothing
  // found with complete confidence.
  if (filters.search?.trim()) q.set("search", filters.search.trim());
  if (filters.status) q.set("status", filters.status);
  if (filters.low_stock) q.set("low_stock", "true");

  const res = await request<ApiResponse<{
    items?: ProductResponse[];
    products?: ProductResponse[];
    pagination?: Pagination;
  }>>(`${BASE_URL}/products/seller/my-products?${q}`, { method: "GET" });
  const payload = (res as any)?.data ?? (res as any);
  return {
    items: payload?.items ?? payload?.products ?? (Array.isArray(payload) ? payload : []),
    pagination: payload?.pagination,
  };
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
