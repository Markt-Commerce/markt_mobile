import { Product } from './products';

export interface CartItem {
    id: number;
    product: Product;
    quantity: number;
    added_at: string;
  }
  
  export interface AddToCartRequest {
    product_id: number;
    quantity: number;
  }
  
  export interface UpdateCartItemRequest {
    quantity: number;
  }
  