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
  price: number;
  variant?: {
    name: string;
    options: Record<string, string>;
  };
  product?: {
    name: string;
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