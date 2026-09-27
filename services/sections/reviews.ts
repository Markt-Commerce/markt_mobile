/**
 * Product reviews.
 *
 * There was no review layer in the app at all: no way to write one, no way to
 * read them, and product detail rendered a bare `Average Rating: 0` line.
 *
 * Two things about the backend contract are worth knowing before calling any of
 * this (see markt_python #93):
 *
 * - Reviews are purchase-gated. Posting one without a delivered order returns
 *   403 with a message meant to be shown to the buyer. That is a normal
 *   outcome, not an error state — most people looking at a product haven't
 *   bought it.
 * - `is_verified` is always true on anything that lands, because the server
 *   resolves the order itself. There is no unverified path, so the badge means
 *   what it says.
 */

import { BASE_URL, request } from "../api";

export interface ReviewAuthor {
  id?: string;
  username?: string;
  /** The API sends profile_picture_url, not profile_picture -- verified
   *  against a live response, having first written the wrong one. */
  profile_picture_url?: string | null;
}

export interface ProductReview {
  id: number;
  user_id?: string;
  product_id?: string;
  rating?: number | null;
  title?: string | null;
  content: string;
  upvotes?: number;
  is_verified?: boolean;
  created_at?: string;
  user?: ReviewAuthor;
}

export interface ReviewPage {
  items: ProductReview[];
  /** Shape confirmed against a live response: total_items / total_pages,
   *  not `total`. */
  pagination?: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  content: string;
}

/** Editable fields. The server refuses anything else, so don't send it. */
export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
}

export async function getProductReviews(
  productId: string,
  page = 1,
  perPage = 10
): Promise<ReviewPage> {
  const res = await request<ReviewPage>(
    `${BASE_URL}/products/${productId}/reviews?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  return { items: res?.items ?? [], pagination: res?.pagination };
}

export async function createProductReview(
  productId: string,
  payload: CreateReviewPayload
): Promise<ProductReview> {
  return request<ProductReview>(`${BASE_URL}/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductReview(
  reviewId: number,
  payload: UpdateReviewPayload
): Promise<ProductReview> {
  return request<ProductReview>(`${BASE_URL}/products/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductReview(
  reviewId: number
): Promise<{ deleted: boolean; review_id: number }> {
  return request<{ deleted: boolean; review_id: number }>(
    `${BASE_URL}/products/reviews/${reviewId}`,
    { method: "DELETE" }
  );
}

/**
 * Mark a review helpful. One per person: a second attempt returns 409, which
 * callers should treat as "already done", not as a failure.
 */
export async function upvoteReview(
  reviewId: number
): Promise<{ success: boolean; new_count: number }> {
  return request<{ success: boolean; new_count: number }>(
    `${BASE_URL}/products/reviews/${reviewId}/upvote`,
    { method: "POST" }
  );
}
