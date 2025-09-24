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
