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

  /**
 * Common type for media variants in the response.
 */
export interface MediaVariant {
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
}

/**
 * Common type for the main media object in the response.
 */
export interface Media {
  tablet_url: string;
  media_type: string;
  social_story_url: string;
  variants: MediaVariant[];
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
}

/**
 * Response type for uploading product images.
 */
export interface ProductImageResponse {
  media_id: number;
  media: Media;
  is_featured: boolean;
  product_id: string;
  sort_order: number;
  alt_text: string;
  id: number;
}

/**
 * Response type for uploading social post media.
 */
export interface SocialPostMediaResponse {
  post_type: string;
  media_id: number;
  media: Media;
  optimized_for_platform: boolean;
  platform: string;
  post_id: string;
  sort_order: number;
  aspect_ratio: string;
  id: number;
}

/**
 * Response type for uploading request images.
 */
export interface RequestImageResponse {
  request_id: string;
  media: Media;
  media_id: number;
  is_primary: boolean;
  id: number;
}