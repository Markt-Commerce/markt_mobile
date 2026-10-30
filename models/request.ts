//for  buyer requests
// /models/request.ts

import type { ProcurementFields } from "./business";

// Markt Business procurement details ride on the same request; a business
// account's request is a procurement request (is_business is set server-side).
export interface CreateRequestPayload extends Omit<ProcurementFields, "is_business"> {
    title: string;
    metadata?: Record<string, any>;
    category_ids?: number[];
    media_ids?: number[];
    expires_at?: string; // ISO string
    description?: string;
    budget?: number;
  }

/** A seller's offer on a request, as GET /requests/<id> returns it. */
export interface RequestOffer {
  id: number;
  request_id: string;
  seller_id: number;
  seller?: { id: number; shop_name?: string; profile_picture_url?: string; verification_status?: string };
  product_id?: string | null;
  price: number;
  message?: string | null;
  /** Procurement offers: how much of the requested quantity, in its unit. */
  proposed_quantity?: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | string;
  created_at: string;
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
  

  export type Request = ProcurementFields & {
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
