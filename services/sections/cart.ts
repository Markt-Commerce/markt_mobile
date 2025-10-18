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
  const res = await request<Cart>(`${BASE_URL}/cart`, {
    method: "GET",
  });
  return res;
}

// Clear cart
export async function clearCart(): Promise<void> {
  await request<void>(`${BASE_URL}/cart`, {
    method: "DELETE",
  });
}

export async function deleteCartItem(id:number) {
  await request<void>(`${BASE_URL}/cart/items/${id}`, {
    method: "DELETE",
  });
}

export async function updateCartItem(id:number,data:{ quantity: number}): Promise<UpdateCartItemResponse> {
  const res = await request<ApiResponse<UpdateCartItemResponse>>(`${BASE_URL}/cart/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data!;
}

// Add item to cart
export async function addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
  const res = await request<AddToCartResponse>(`${BASE_URL}/cart/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res;
}


//get cart summary
export async function getCartSummary() {
  const res = await request<CartSummary>(`${BASE_URL}/cart/summary`, {
    method: "GET",
  });
  return res;
}

export async function checkoutCart(data:CheckoutRequest) {
  const res = await request<void>(`${BASE_URL}/cart/checkout`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res;
}