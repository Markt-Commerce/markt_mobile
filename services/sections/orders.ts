import { request, BASE_URL } from "../api";
import { Order, OrderItem, CreateOrderPayload, PayOrderPayload, UpdateOrderItemPayload, Pagination, SellerOrderItem, OrderTracking, DeliveryWaitChoiceResponse } from "../../models/orders";

// Get buyer orders
export async function getBuyerOrders(page = 1, per_page = 10): Promise<Order[]> {
    // Trailing slash before the query: `/orders` 308-redirects to cleartext
    // `http://.../orders/`, which release Android APKs block.
    const res = await request<Order[]>(`${BASE_URL}/orders/?page=${page}&per_page=${per_page}`, {
      method: "GET",
    });
    return res;
  }
  
  // Get seller orders — SELLER_DASHBOARD_API_AND_MOBILE_GUIDE §4
  export async function getSellerOrders(
    page = 1,
    per_page = 10,
    status?: "pending" | "processing" | "shipped" | "delivered"
  ): Promise<{ items: SellerOrderItem[]; pagination?: Pagination }> {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.set("status", status);
    const res = await request<{ items: SellerOrderItem[]; pagination?: Pagination }>(
      `${BASE_URL}/orders/seller?${params}`,
      { method: "GET" }
    );
    return res;
  }
  
  // Get order details
  export async function getOrderDetails(order_id: string): Promise<Order> {
    const res = await request<Order>(`${BASE_URL}/orders/${order_id}`, { method: "GET" });
    return res;
  }
  
  // Create new order
  /** @deprecated Use checkoutCart (POST /cart/checkout) — POST /orders returns 410 Gone. */
  export async function createOrder(data: CreateOrderPayload): Promise<Order> {
    const res = await request<Order>(`${BASE_URL}/orders/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  }
  
  // Pay for an order
  /** @deprecated Use POST /payments/initialize or /payments/create instead. */
  export async function payOrder(order_id: string, data: PayOrderPayload): Promise<Order> {
    const res = await request<Order>(`${BASE_URL}/orders/${order_id}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  }
  
  // Track order status and delivery progress, per-item (Phase 13)
  export async function trackOrder(order_id: string): Promise<OrderTracking> {
    const res = await request<OrderTracking>(`${BASE_URL}/orders/${order_id}/track`, { method: "GET" });
    return res;
  }

  // 10.3: buyer's response to the thin-volume delivery prompt (wait for a
  // fuller run, optionally consenting to the single-drop fallback rate --
  // or pay now for single/near-single delivery).
  export async function submitDeliveryWaitChoice(
    order_id: string,
    choice: "wait" | "pay_now",
    fallback_consent = false,
  ): Promise<DeliveryWaitChoiceResponse> {
    const res = await request<DeliveryWaitChoiceResponse>(
      `${BASE_URL}/orders/${order_id}/delivery-wait-choice`,
      {
        method: "POST",
        body: JSON.stringify({ choice, fallback_consent }),
      },
    );
    return res;
  }

  // Update seller order item status
  export async function updateSellerOrderItem(order_item_id: number, data: UpdateOrderItemPayload): Promise<OrderItem> {
    const res = await request<OrderItem>(`${BASE_URL}/orders/seller/items/${order_item_id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res;
  }