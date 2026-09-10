// models/user.ts
export type Address = {
    house_number?: string;
    country?: string;
    street?: string;
    city?: string;
    longitude?: number;
    latitude?: number;
    state?: string;
    postal_code?: string;
  };
  
  export type BuyerAccount = {
    is_active?: boolean;
    created_at?: string;
    pending_orders?: number;
    total_orders?: number;
    buyername?: string;
    shipping_address?: Record<string, any>;
    last_order_date?: string;
    id?: number;
  };

  export interface SellerAccount {
  shop_slug: string;
  total_rating: number;
  is_active: boolean;
  joined_date: string;
  policies: SellerPolicies;
  description: string;
  average_rating: number;
  categories: string;
  verification_status: 'verified' | 'unverified' | 'pending';
  shop_name: string;
  total_products: number;
  total_raters: number;
  id: number;
  total_sales: number;
}

  export interface UserProfile {
  id: string;
  username: string;
  email: string;
  email_verified: boolean;
  phone_number: string;
  profile_picture: string;
  profile_picture_url: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
  current_role: string;
  is_buyer: boolean;
  is_seller: boolean;
  address: Address;
  buyer_account: BuyerAccount;
  seller_account: SellerAccount;
}
  

export interface ShippingAddress {
  additionalProp1?: string;
  additionalProp2?: string;
  additionalProp3?: string;
}

export interface SellerPolicies {
  additionalProp1?: string;
  additionalProp2?: string;
  additionalProp3?: string;
}

/** Request body for PATCH /api/v1/users/profile */
export interface UpdateProfileRequest {
  phone_number?: string;
  profile_picture?: string;
}

/** Request body for PATCH /api/v1/users/profile/buyer */
export interface UpdateBuyerProfileRequest {
  buyername?: string;
  shipping_address?: ShippingAddress;
}

/** Request body for PATCH /api/v1/users/profile/seller */
export interface UpdateSellerProfileRequest {
  description?: string;
  policies?: SellerPolicies;
  category_ids?: number[];
  shop_name?: string;

  /**
   * Where the shop is. This is what the proximity feed ranks against — without
   * it a seller is unlocated and only ever appears on the nationwide rung.
   *
   * Sent as a pair or not at all; the backend refuses a lone coordinate, and
   * refuses (0, 0) since that is what a failed geocode looks like.
   */
  shop_latitude?: number;
  shop_longitude?: number;
  shop_address?: Record<string, unknown>;
}
