/* import { Product } from './products';

// models/cart.ts

export interface Seller {
  id: number;
  profile_picture_url: string;
  average_rating: number;
  verification_status: "unverified" | "verified" | string;
  total_products: number;
  shop_slug: string;
  shop_name: string;
}

export interface CartItem {
  product_id: string;
  variant_id: number;
  product_price: number;
  product: Product;
  quantity: number;
  id: number;
}

export interface Cart {
  coupon_code: string;
  buyer_id: number;
  expires_at: string;
  items: CartItem[];
  subtotal: string;
  total_items: string;
  id: number;
}

export interface CartSummary {
  discount: number;
  subtotal: number;
  total: number;
  item_count: number;
}

export interface AddToCartRequest {
  product_id: string;
  variant_id: number;
  quantity: number;
}

export type AddToCartResponse = CartItem;

export interface UpdateCartItemRequest {
  quantity: number;
}

export type UpdateCartItemResponse = CartItem;

export interface CheckoutRequest {
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  notes: string;
}
 */



// models/cart.ts
export interface MediaVariant {
  height: number;
  quality: number;
  file_size: number;
  width: number;
  processing_time: number;
  storage_key: string;
  format: string;
  variant_type: string;
  url: string;
  id: number;
}

export interface Media {
  updated_at: string;
  file_size: number;
  mobile_url: string;
  variants: MediaVariant[];
  user_id: string;
  media_type: string;
  duration: number;
  processing_status: string;
  height: number;
  tablet_url: string;
  social_post_url: string;
  original_filename: string;
  is_public: boolean;
  width: number;
  alt_text: string;
  storage_key: string;
  background_removed: boolean;
  compression_quality: number;
  social_story_url: string;
  caption: string;
  social_square_url: string;
  created_at: string;
  desktop_url: string;
  exif_data: Record<string, string>;
  original_url: string;
  thumbnail_url: string;
  id: number;
  mime_type: string;
}

export interface ProductImage {
  product_id: string;
  is_featured: boolean;
  sort_order: number;
  media_id: number;
  alt_text: string;
  media: Media;
  id: number;
}

export interface Seller {
  id: number;
  profile_picture_url: string;
  average_rating: number;
  verification_status: "unverified" | "verified" | string;
  total_products: number;
  shop_slug: string;
  shop_name: string;
}

export interface ProductVariant {
  options: Record<string, string>;
  name: string;
}

export interface Product {
  updated_at: string;
  variants: ProductVariant[];
  status: string;
  average_rating: number;
  category_ids: number[];
  seller_id: number;
  product_metadata: Record<string, string>;
  review_count: number;
  barcode: string;
  images: ProductImage[];
  seller: Seller;
  tag_ids: number[];
  sku: string;
  name: string;
  cost_per_item: number;
  media_ids: number[];
  compare_at_price: number;
  description: string;
  created_at: string;
  weight: number;
  price: number;
  categories: string;
  view_count: number;
  id: string;
  stock: number;
}

export interface CartItem {
  product_id: string;
  variant_id: number;
  product_price: number;
  product: Product;
  quantity: number;
  id: number;
}

export interface Cart {
  coupon_code: string;
  buyer_id: number;
  expires_at: string;
  items: CartItem[];
  subtotal: string;
  total_items: string;
  id: number;
}

export interface CartSummary {
  discount: number;
  subtotal: number;
  total: number;
  item_count: number;
}

export interface AddToCartRequest {
  product_id: string;
  variant_id: number;
  quantity: number;
}

export type AddToCartResponse = CartItem;

export interface UpdateCartItemRequest {
  quantity: number;
}

export type UpdateCartItemResponse = CartItem;

export interface CheckoutRequest {
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  notes: string;
}
