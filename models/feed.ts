export interface MediaVariant {
    height: number;
    width: number;
    quality: number;
    file_size: number;
    processing_time: number;
    storage_key: string;
    format: string;
    variant_type: string;
    url: string;
    id: number;
  }
  
  export interface Media {
    original_url: string;
    social_post_url: string;
    thumbnail_url: string;
    processing_status: string;
    width: number;
    mobile_url: string;
    social_square_url: string;
    original_filename: string;
    variants: MediaVariant[];
    file_size: number;
    created_at: string;
    updated_at: string;
    tablet_url: string;
    id: number;
    alt_text: string;
    background_removed: boolean;
    mime_type: string;
    duration: number;
    height: number;
    is_public: boolean;
    social_story_url: string;
    desktop_url: string;
    media_type: string;
    compression_quality: number;
    storage_key: string;
    user_id: string;
    caption: string;
    exif_data: Record<string, string>;
  }
  
  export interface Seller {
    id: number;
    profile_picture_url: string;
    average_rating: number;
    verification_status: string;
    total_products: number;
    shop_slug: string;
    shop_name: string;
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
  
  export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    compare_at_price: number;
    stock: number;
    average_rating: number;
    review_count: number;
    images: ProductImage[];
    seller: Seller;
    status: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Post {
    id: string;
    caption: string;
    created_at: string;
    comment_count: number;
    like_count: number;
    status: string;
    categories: string;
    seller?: Seller;
    user: {
      id: string;
      username: string;
      profile_picture_url: string;
    };
    social_media: {
      platform: string;
      aspect_ratio: string;
      post_id: string;
      post_type: string;
      media: Media;
    }[];
    products: { product_id: string }[];
  }
  
  // models/feed.ts
export interface BuyerRequest {
    id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    created_at: string;
    buyer: {
      id: string;
      username: string;
      profile_picture_url: string;
    };
  }
  
  export type FeedItem =
    | { type: "product"; data: Product }
    | { type: "post"; data: Post }
    | { type: "request"; data: BuyerRequest };
  