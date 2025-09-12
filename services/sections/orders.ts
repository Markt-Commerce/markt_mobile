import { request, BASE_URL } from "../api";
import { Order, OrderItem, CreateOrderPayload, PayOrderPayload, UpdateOrderItemPayload, Pagination } from "../../models/orders";

// Get buyer orders
export async function getBuyerOrders(page = 1, per_page = 10): Promise<Order[]> {
    const res = await request<Order[]>(`${BASE_URL}/orders?page=${page}&per_page=${per_page}`, {
      method: "GET",
    });
    return res;
  }
  
  // Get seller orders
  export async function getSellerOrders(page = 1, per_page = 10): Promise<{ items: OrderItem[]; pagination: Pagination }> {
    const res = await request<{ items: OrderItem[]; pagination: Pagination }>(
      `${BASE_URL}/orders/seller?page=${page}&per_page=${per_page}`,
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
  export async function createOrder(data: CreateOrderPayload): Promise<Order> {
    const res = await request<Order>(`${BASE_URL}/orders`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  }
  
  // Pay for an order
  export async function payOrder(order_id: string, data: PayOrderPayload): Promise<Order> {
    const res = await request<Order>(`${BASE_URL}/orders/${order_id}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
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