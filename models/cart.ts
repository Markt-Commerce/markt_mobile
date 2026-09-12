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

/** Matches the fields the backend reads off checkout_data.shipping_address (see tempinst.py) */
export interface ShippingAddressPayload {
  recipient_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckoutRequest {
  billing_address: Record<string, string>;
  shipping_address: ShippingAddressPayload;
  notes?: string;
  use_saved_address?: boolean;
  idempotency_key?: string;
  /** From POST /delivery/quote. Absent means the server's flat estimate. */
  delivery_quote_id?: string;
  batch_opt_in?: boolean;
  /** Check out only this shop's items. A basket spanning several shops is
   * several orders, one per shop; the app shows them as separate cards and
   * sends whichever was tapped. */
  seller_id?: number;
  /** A discount this shop offered in chat, if the buyer chose to spend it.
   * The server re-checks it against this shop and this total, and spends it
   * only if the order is created. */
  discount_id?: number;
}

export interface CheckoutResponse {
  message: string;
  order_id: string;
  order_number?: string;
  status?: string;
  subtotal?: number;
  shipping_fee?: number;
  tax?: number;
  discount?: number;
  total?: number;
  shipping_address?: ShippingAddressPayload;
}

/** One shop's worth of the basket — what will become one order.
 * Backend: GET /cart/groups. A delivery quote prices one pickup to one
 * dropoff, so a basket spanning two shops is two deliveries and two orders. */
export interface CartGroup {
  seller_id: number | null;
  shop_name: string | null;
  shop_slug: string | null;
  banner_url: string | null;
  item_count: number;
  subtotal: number;
  items: CartItem[];
}

export interface GroupedCart {
  groups: CartGroup[];
  /** More than one means the buyer checks out more than once. */
  group_count: number;
  total_items: number;
}


// The Service Fee, mirrored from app/orders/fees.py so the card can show the
// same total the server will charge. The server is the authority; this only
// decides what the buyer is told before they commit.
const SERVICE_FEE_RATE = 0.025;
const SERVICE_FEE_FLOOR = 25;
const SERVICE_FEE_CEILING = 1000;

/** What Markt charges for servicing an order of this size.
 *
 * Takes the amount actually being paid for goods -- subtotal less any
 * discount -- because that is what the server charges it on. A basket
 * discounted to nothing owes no fee: there is no order to service. */
export function serviceFeeFor(goodsTotal: number): number {
  if (!goodsTotal || goodsTotal <= 0) return 0;
  return Math.min(
    Math.max(goodsTotal * SERVICE_FEE_RATE, SERVICE_FEE_FLOOR),
    SERVICE_FEE_CEILING
  );
}
