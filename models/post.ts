//
// /models/post.ts

export interface CreatePostRequest {
    products?: { product_id: string }[];
    status?: "published"| "draft" | string;
    tags?: string[];
    category_ids?: number[];
    media_ids?: number[];
    caption?: string;
  }
  
  export interface SocialMediaItem {
    optimized_for_platform?: boolean;
    media_id?: number;
    sort_order?: number;
    id?: number;
    post_id?: string;
    post_type?: string;
    media?: any;
    aspect_ratio?: string;
    platform?: string;
  }
  
  export interface PostResponse {
    seller_id?: number;
    products?: { product_id: string }[];
    status?: string;
    comment_count?: number;
    id: string;
    categories?: any[];
    created_at?: string;
    like_count?: number;
    user?: { profile_picture_url?: string; id?: string; username?: string };
    social_media?: SocialMediaItem[];
    niche_context?: Record<string, any>;
    seller?: any;
    caption?: string;
  }
  

  export type PostDetails = {
  social_media: {
    post_type: string;
    media_id: number;
    media: {
      tablet_url: string;
      media_type: string;
      social_story_url: string;
      variants: {
        storage_key: string;
        url: string;
        variant_type: string;
        processing_time: number;
        file_size: number;
        format: string;
        quality: number;
        id: number;
        height: number;
        width: number;
      }[];
      file_size: number;
      alt_text: string;
      social_square_url: string;
      id: number;
      desktop_url: string;
      is_public: boolean;
      height: number;
      exif_data: Record<string, string>;
      mobile_url: string;
      created_at: string;
      width: number;
      original_url: string;
      updated_at: string;
      background_removed: boolean;
      caption: string;
      user_id: string;
      original_filename: string;
      mime_type: string;
      thumbnail_url: string;
      compression_quality: number;
      processing_status: string;
      storage_key: string;
      duration: number;
      social_post_url: string;
    };
    optimized_for_platform: boolean;
    platform: string;
    post_id: string;
    sort_order: number;
    aspect_ratio: string;
    id: number;
  }[];
  seller: {
    average_rating: number;
    shop_name: string;
    verification_status: "unverified" | "verified";
    profile_picture_url?: string;
    shop_slug: string;
    id: number;
    total_products: number;
  };
  status: "draft" | "active" | "archived";
  products: {
    product_id: string;
  }[];
  caption: string;
  like_count: number;
  comment_count: number;
  categories: string;
  created_at: string;
  niche_context: Record<string, string>;
  seller_id: number;
  id: string;
  user: {
    id: string;
    username: string;
    profile_picture_url: string;
  };
};


export type CommentResponse = {
  pagination: {
    total_items: number;
    per_page: number;
    page: number;
    total_pages: number;
  };
  items: CommentItem[];
};

export type CommentItem = {
    post_id: string;
    user_id: string;
    content: string;
    created_at: string; // ISO date string
    id: number;
    user: {
      id: string;
      username: string;
      profile_picture_url: string;
    };
  }
