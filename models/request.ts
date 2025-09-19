//for  buyer requests
// /models/request.ts

export interface CreateRequestPayload {
    title: string;
    metadata?: Record<string, any>;
    category_ids?: number[];
    media_ids?: number[];
    expires_at?: string; // ISO string
    description?: string;
    budget?: number;
  }
  
  export interface RequestCategory {
    is_active?: boolean;
    id?: number;
    parent_id?: number;
    slug?: string;
    description?: string;
    name?: string;
    image_url?: string;
  }
  
  export interface RequestImageMedia {
    media_id?: number;
    is_primary?: boolean;
    id?: number;
    request_id?: string;
    media?: any;
  }
  
  export interface RequestResponse {
    status?: "OPEN" | "CLOSED" | string;
    title: string;
    id: string;
    categories?: RequestCategory[];
    user_id?: string;
    created_at?: string;
    images?: RequestImageMedia[];
    upvotes?: number;
    user?: any;
    updated_at?: string;
    media_ids?: number[];
    expires_at?: string;
    description?: string;
    views?: number;
    request_metadata?: Record<string, any>;
    offers?: any[];
    budget?: number;
  }
  