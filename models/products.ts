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
  
  export interface UpdateProductRequest {
    name?: string;
    description?: string;
    price?: string;
    discount_price?: string;
    category_id?: number;
    in_stock?: boolean;
    images?: File[]; // optional, may be re-uploaded
  }

  // /models/product.ts

export interface ProductVariant {
  name: string;
  options: Record<string, string>;
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
  media_ids?: number[]; // IDs from your media upload endpoint
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

export interface ProductImageMedia {
  processing_status?: string;
  mobile_url?: string;
  desktop_url?: string;
  user_id?: string;
  width?: number;
  tablet_url?: string;
  file_size?: number;
  caption?: string;
  id?: number;
  social_story_url?: string;
  mime_type?: string;
  created_at?: string;
  duration?: number;
  alt_text?: string;
  media_type?: string;
  original_url?: string;
  social_post_url?: string;
  compression_quality?: number;
  height?: number;
  exif_data?: Record<string, any>;
  thumbnail_url?: string;
  variants?: ProductImageMediaVariant[];
  is_public?: boolean;
  background_removed?: boolean;
  updated_at?: string;
  social_square_url?: string;
  storage_key?: string;
  original_filename?: string;
}

export interface ProductImage {
  media_id?: number;
  is_featured?: boolean;
  product_id?: string;
  id?: number;
  sort_order?: number;
  media?: ProductImageMedia;
  alt_text?: string;
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

  