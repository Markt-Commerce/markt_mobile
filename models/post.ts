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
  