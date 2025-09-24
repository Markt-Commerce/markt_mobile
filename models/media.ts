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