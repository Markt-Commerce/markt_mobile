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
} from "../../models/cart";
import { ApiResponse } from "../../models/auth";

// Get cart
export async function getCart(): Promise<Cart> {
  const res = await request<ApiResponse<Cart>>(`${BASE_URL}/cart`, {
    method: "GET",
  });
  return res.data!;
}

// Clear cart
export async function clearCart(): Promise<void> {
  await request<void>(`${BASE_URL}/cart`, {
    method: "DELETE",
  });
}

// Add item to cart
export async function addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
  const res = await request<ApiResponse<AddToCartResponse>>(`${BASE_URL}/cart/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data!;
}

// Update cart item
export async function updateCartItem(itemId: number, data: UpdateCartItemRequest): Promise<UpdateCartItemResponse> {
  const res = await request<ApiResponse<UpdateCartItemResponse>>(
    `${BASE_URL}/cart/items/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return res.data!;
}

// Delete cart item
export async function deleteCartItem(itemId: number): Promise<void> {
  await request<void>(`${BASE_URL}/cart/items/${itemId}`, {
    method: "DELETE",
  });
}

// Checkout
export async function checkoutCart(data: CheckoutRequest): Promise<void> {
  await request<void>(`${BASE_URL}/cart/checkout`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Get cart summary
export async function getCartSummary(): Promise<CartSummary> {
  const res = await request<ApiResponse<CartSummary>>(`${BASE_URL}/cart/summary`, {
    method: "GET",
  });
  return res.data!;
}
