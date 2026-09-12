export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    discount_price: string | null;
    category: {
      id: number;
      name: string;
    };
    images: string[];
    seller_id: string;
    created_at: string;
    updated_at: string;
    in_stock: boolean;
  }

  export interface ProductDetail {
    id: string;
    name: string;
    description: string;
    sku: string;
    barcode: string;
    status: string;
    average_rating: number;
    review_count: number;
    weight: number;
    seller_id: number;
    created_at: string;
    updated_at: string;
    categories: string;
    media_ids: number[];
    compare_at_price: number;
    cost_per_item: number;
    price: number;
    stock: number;
    view_count: number;
    tag_ids: number[];
    category_ids: number[];
    product_metadata: Record<string, string>;
    variants: Variant[];
    images: ProductImage[];
    seller: Seller;
    seller_user:SellerUser;
  }

  
  export interface Variant {
    name: string;
    options: Record<string, string>;
  }
  
  export interface ProductImage {
    id: number;
    media_id: number;
    alt_text: string;
    is_featured: boolean;
    sort_order: number;
    product_id: string;
    media: Media;
  }

  export interface Media {
    id: number;
    user_id: string;
    media_type: string;
    original_url: string;
    thumbnail_url: string;
    tablet_url: string;
    mobile_url: string;
    desktop_url: string;
    social_post_url: string;
    social_square_url: string;
    social_story_url: string;
    original_filename: string;
    caption: string;
    mime_type: string;
    exif_data: Record<string, string>;
    variants: MediaVariant[];
    width: number;
    height: number;
    duration: number;
    is_public: boolean;
    background_removed: boolean;
    processing_status: string;
    compression_quality: number;
    storage_key: string;
    file_size: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface MediaVariant {
    id: number;
    url: string;
    format: string;
    variant_type: string;
    quality: number;
    width: number;
    height: number;
    file_size: number;
    processing_time: number;
    storage_key: string;
  }
  
  export interface Seller {
    id: number;
    shop_name: string;
    shop_slug: string;
    profile_picture_url: string;
    average_rating: number;
    /** How many ratings average_rating is built from. Only populated since
     *  markt_python #93 -- nothing wrote the column before that, so older
     *  payloads omit it rather than reporting a real zero. */
    total_raters?: number;
    total_rating?: number;
    total_products: number;
    verification_status: string;
    /** Where the shop is, so the app can ask whether we deliver from there
     *  before letting someone fill a basket they could never check out. Null
     *  when the seller has not pinned their shop. */
    shop_latitude?: number | null;
    shop_longitude?: number | null;
    /** Where the shop is, in words. The coordinate is the authority on where
     *  it actually is; this is what a person reads. Null until the seller
     *  sets it. */
    shop_address?: ShopAddress | null;
  }

  export interface ShopAddress {
    formatted: string | null;
    city: string | null;
    state: string | null;
  }

  interface SellerUser{
    id: string;
    profile_picture: string; 
    username: string;
  }
  
export interface PlaceholderProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
}
  
  /**
   * Partial update — anything omitted is left as-is. Mirrors
   * ProductUpdateSchema in app/products/schemas.py.
   *
   * This previously described an endpoint that does not exist: `price` as a
   * string, plus discount_price, category_id, in_stock and `images: File[]`,
   * none of which the backend accepts. Nothing referenced it, because nothing
   * called the update endpoint at all.
   */
  export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    compare_at_price?: number;
    cost_per_item?: number;
    stock?: number;
    sku?: string;
    barcode?: string;
    weight?: number;
    status?: string;
    category_ids?: number[];
    tag_ids?: number[];
    /** The product's photos, as media ids, in the order they should show.
     *
     * The server has always accepted this; it was missing here, which is a
     * large part of why nothing in the app could add a photo to a listing
     * after it was created.
     *
     * Replaces the whole set. Leave it out to keep the photos as they are --
     * sending an empty array removes them all, so a screen that only changes
     * the price must not send it. */
    media_ids?: number[];
  }

  // /models/product.ts

export interface ProductVariant {
  name: string;
  options?: Record<string, string>;
}

export interface CreateProductRequest {
  tag_ids?: number[];
  variants?: ProductVariant[];
  status?: "active" | "draft" | string;
  cost_per_item?: number;
  compare_at_price?: number;
  barcode?: string;
  stock?: number;
  price: number;
  category_ids?: number[];
  media_ids?: number[]; // from media upload endpoint
  sku?: string;
  description?: string;
  name: string;
  weight?: number;
  product_metadata?: Record<string, any>;
}

export interface ProductImageMediaVariant {
  processing_time?: number;
  format?: string;
  id?: number;
  file_size?: number;
  quality?: number;
  url?: string;
  height?: number;
  width?: number;
  storage_key?: string;
  variant_type?: string;
}

export interface Category {
  is_active?: boolean;
  id?: number;
  parent_id?: number;
  slug?: string;
  description?: string;
  name?: string;
  image_url?: string;
}

export interface SellerSummary {
  average_rating?: number;
  profile_picture_url?: string;
  verification_status?: string;
  shop_name?: string;
  id?: number;
  shop_slug?: string;
  total_products?: number;
  /** Where the shop is, so the app can ask whether we deliver from there
   * before letting someone fill a basket they could never check out. */
  shop_latitude?: number | null;
  shop_longitude?: number | null;
}

export interface ProductResponse {
  cost_per_item?: number;
  barcode?: string;
  price: number;
  average_rating?: number;
  review_count?: number;
  view_count?: number;
  id: string;
  created_at?: string;
  category_ids?: number[];
  product_metadata?: Record<string, any>;
  categories?: Category[];
  images?: ProductImage[];
  media_ids?: number[];
  description?: string;
  sku?: string;
  name: string;
  seller?: SellerSummary;
  tag_ids?: number[];
  variants?: ProductVariant[];
  status?: string;
  compare_at_price?: number;
  stock?: number;
  updated_at?: string;
  seller_id?: number;
  weight?: number;
}

  