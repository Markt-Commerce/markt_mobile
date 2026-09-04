// services/cart.ts
import { request, BASE_URL } from "../api";
import {
  Cart,
  CartSummary,
  AddToCartRequest,
  AddToCartResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
  CheckoutRequest,
  CheckoutResponse,
} from "../../models/cart";
import { ApiResponse } from "../../models/auth";
import { setPendingCartCount } from "../notificationState";
import { emitBadgeChanged } from "../../utils/badgeEvents";

// Get cart
export async function getCart(): Promise<Cart> {
  // Trailing slash: `/cart` 308-redirects to cleartext `http://.../cart/`, which
  // release Android APKs block — hitting the canonical URL avoids the redirect.
  const res = await request<Cart>(`${BASE_URL}/cart/`, {
    method: "GET",
  });
  // Cache the count so the background reminder worker can nudge an abandoned
  // cart without a network call.
  try {
    await setPendingCartCount(res?.items?.length ?? 0);
  } catch {
    /* non-fatal */
  }
  return res;
}

// Clear cart
export async function clearCart(): Promise<void> {
  // Trailing slash — see getCart: the slash-less URL 308-redirects to cleartext
  // http, which release Android blocks.
  await request<void>(`${BASE_URL}/cart/`, {
    method: "DELETE",
  });
  emitBadgeChanged();
}

export async function deleteCartItem(id:number) {
  await request<void>(`${BASE_URL}/cart/items/${id}`, {
    method: "DELETE",
  });
  emitBadgeChanged();
}

export async function updateCartItem(id:number,data:{ quantity: number}): Promise<UpdateCartItemResponse> {
  const res = await request<ApiResponse<UpdateCartItemResponse>>(`${BASE_URL}/cart/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  emitBadgeChanged();
  return res.data!;
}

// Add item to cart
export async function addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
  const res = await request<AddToCartResponse>(`${BASE_URL}/cart/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  emitBadgeChanged();
  return res;
}


//get cart summary
export async function getCartSummary() {
  const res = await request<CartSummary>(`${BASE_URL}/cart/summary`, {
    method: "GET",
  });
  return res;
}

export async function checkoutCart(data:CheckoutRequest): Promise<CheckoutResponse> {
  const res = await request<CheckoutResponse>(`${BASE_URL}/cart/checkout`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  // Checkout empties the cart server-side, so the badge has to clear too.
  emitBadgeChanged();
  return res;
}