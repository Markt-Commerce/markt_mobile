import { Product } from './products';

export interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total?: number;
  shipping_fee?: number;
  tax?: number;
  discount?: number;
  payment_method?: string;
  customer_note?: string;
  buyer_id?: number;
  seller_id?: number;
  cart_id: number;
  created_at: string;
  shipping_address?: Record<string, any>;
  items?: OrderItem[];
  buyer?: {
    id: number;
    buyername: string;
    profile_picture_url?: string;
  };
}

export interface CreateOrderRequest {
  items: OrderItem[];
  shipping_address: Record<string, string>;
}

export interface PayOrderRequest {
  payment_method: string;
  transaction_id: string;
}

// ---------- Types ----------
export interface Pagination {
  total_pages: number;
  per_page: number;
  total_items: number;
  page: number;
}

export interface OrderItem {
  quantity: number;
  status: string;
  variant_id?: number;
  seller_id?: number;
  product_id: string;
  order_id?: string;
  price: number;
  variant?: {
    name: string;
    options: Record<string, string>;
  };
  product?: {
    /** Since markt_python's order-item product summary: an order item used to
     *  carry only product_id, which is why order rows showed "No image". */
    id?: string;
    name: string;
    image_url?: string | null;
  };
}

export interface SellerOrderItem {
  id: number;
  created_at: string;
  order_id: string;
  price: number;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled' | string;
  variant: string | null;
  product: {
    id?: string;
    name: string;
    image_url?: string | null;
  };
  order: {
    id: string;
    created_at: string;
    order_number: string | null;
    buyer: {
      id: number;
      buyername?: string;
      username?: string;
      profile_picture?: string | null;
      profile_picture_url?: string | null;
    };
  };
}


export interface CreateOrderPayload {
  customer_note?: string;
  shipping_address?: Record<string, any>;
  payment_method: string;
  cart_id: number;
}

export interface PayOrderPayload {
  currency: string;
  order_id: string;
  method: string;
  amount: number;
}

export interface UpdateOrderItemPayload {
  status: string;
}

export interface TrackingTimelineEntry {
  status: string;
  label: string;
  timestamp: string | null;
}

export interface TrackingItem {
  id: number;
  product_id: string;
  quantity: number;
  status: string;
  seller_id: number;
}

export interface TrackingShipment {
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface TrackingDelivery {
  assignment_id: string;
  status: string;
  logistical_status: string | null;
  assigned_at: string | null;
}

export interface PodCode {
  ready: boolean;
  system: "single_order" | "run" | null;
  code: string | null;
}

export interface OrderCancelResponse {
  order_id: string;
  status: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  refund_amount: number;
}

export interface DeliveryWaitChoiceResponse {
  order_id: string;
  choice: "wait" | "pay_now";
  fallback_consent: boolean;
  refund_amount: number;
}

export interface OrderTracking {
  order_id: string;
  order_number: string | null;
  status: string;
  timeline: TrackingTimelineEntry[];
  shipping_address: Record<string, any> | null;
  items: TrackingItem[];
  shipment: TrackingShipment | null;
  delivery: TrackingDelivery | null;
}
