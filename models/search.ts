// =========================
// Root Response
// =========================

export interface SearchResponse {
  page: number;
  per_page: number;
  posts: Post[];
  products: Product[];
  sellers: Seller[];
}

// =========================
// Post + Social Media
// =========================

export interface Post {
  created_at: string;
  like_count: number;
  status: "draft" | "published" | string;
  categories: string;
  comment_count: number;
  user_id: string;
  caption: string;
  niche_context: Record<string, string>;
  user: UserSummary;
  products: PostProduct[];
  social_media: SocialMediaPost[];
  id: string;
}

export interface UserSummary {
  id: string;
  profile_picture_url: string;
  username: string;
}

export interface PostProduct {
  product_id: string;
}

export interface SocialMediaPost {
  post_id: string;
  sort_order: number;
  aspect_ratio: string;
  optimized_for_platform: boolean;
  media: Media;
  media_id: number;
  post_type: "story" | "post" | string;
  id: number;
  platform: "instagram" | "facebook" | string;
}

// =========================
// Media + Variants
// =========================

export interface Media {
  variants: MediaVariant[];
  desktop_url: string;
  updated_at: string;
  id: number;
  created_at: string;
  social_story_url: string;
  file_size: number;
  exif_data: Record<string, string>;
  alt_text: string;
  user_id: string;
  caption: string;
  is_public: boolean;
  storage_key: string;
  processing_status: string;
  media_type: "image" | "video" | string;
  thumbnail_url: string;
  tablet_url: string;
  social_square_url: string;
  height: number;
  background_removed: boolean;
  mime_type: string;
  social_post_url: string;
  duration: number;
  width: number;
  compression_quality: number;
  mobile_url: string;
  original_filename: string;
  original_url: string;
}

export interface MediaVariant {
  url: string;
  processing_time: number;
  file_size: number;
  width: number;
  height: number;
  storage_key: string;
  quality: number;
  variant_type: "original" | "compressed" | string;
  format: string;
  id: number;
}

// =========================
// Product
// =========================

export interface Product {
  average_rating: number;
  variants: ProductVariant[];
  categories: string;
  updated_at: string;
  id: string;
  price: number;
  seller_user: string;
  created_at: string;
  stock: number;
  media_ids: number[];
  status: "active" | "inactive" | string;
  view_count: number;
  name: string;
  seller_id: number;
  category_ids: number[];
  sku: string;
  images: ProductImage[];
  description: string;
  seller: Seller;
  barcode: string;
  compare_at_price: number;
  tag_ids: number[];
  product_metadata: Record<string, string>;
  weight: number;
  cost_per_item: number;
  review_count: number;
}

export interface ProductVariant {
  name: string;
  options: Record<string, string>;
}

export interface ProductImage {
  product_id: string;
  is_featured: boolean;
  alt_text: string;
  sort_order: number;
  media: Media;
  media_id: number;
  id: number;
}

// =========================
// Seller
// =========================

export interface Seller {
  average_rating: number;
  shop_slug: string;
  shop_name: string;
  profile_picture_url: string;
  total_products: number;
  verification_status: "unverified" | "pending" | "verified" | string;
  id: number;
}
