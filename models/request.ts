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
  
  //might be unused 
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
  

  export type Request = {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: "OPEN" | "CLOSED" | "EXPIRED" | string;
  upvotes: number;
  views: number;

  created_at: string;   // ISO datetime
  updated_at: string;   // ISO datetime
  expires_at: string;   // ISO datetime

  images: string[];
  offers: any[];        // tighten this when offer shape is known
  request_metadata: Record<string, any>;

  categories: Category[];

  user_id: string;
  user: User;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
};

export type User = {
  id: string;
  username: string;
  email: string;
  phone_number: string;

  current_role: "buyer" | "seller" | string;
  is_buyer: boolean;
  is_seller: boolean;
  email_verified: boolean;

  profile_picture: string | null;
  profile_picture_url: string | null;

  created_at: string;     // ISO datetime
  updated_at: string;     // ISO datetime
  last_login_at: string;  // ISO datetime
};
