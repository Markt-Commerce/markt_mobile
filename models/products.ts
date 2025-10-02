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
    total_products: number;
    verification_status: string;
  }
  
export interface PlaceholderProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
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

  