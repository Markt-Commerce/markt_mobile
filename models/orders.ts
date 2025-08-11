import { Product } from './products';

export interface OrderItem {
    product_id: number;
    quantity: number;
  }
  
  export interface Order {
    id: number;
    order_items: {
      product: Product;
      quantity: number;
    }[];
    buyer: {
      id: string;
      buyername: string;
    };
    total_amount: string;
    status: 'pending' | 'paid' | 'cancelled';
    created_at: string;
    updated_at: string;
  }
  
  export interface CreateOrderRequest {
    items: OrderItem[];
    shipping_address: Record<string, string>;
  }
  
  export interface PayOrderRequest {
    payment_method: string;
    transaction_id: string;
  }
  