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
  
  export type SellerAccount = {
    average_rating?: number;
    is_active?: boolean;
    shop_slug?: string;
    total_products?: number;
    total_raters?: number;
    verification_status?: string;
    joined_date?: string;
    policies?: Record<string, any>;
    shop_name?: string;
    categories?: any;
    id?: number;
    description?: string;
    total_rating?: number;
    total_sales?: number;
  };
  
  export type UserProfile = {
    id: string;
    username?: string;
    email?: string;
    profile_picture_url?: string;
    phone_number?: string;
    address?: Address;
    buyer_account?: BuyerAccount;
    seller_account?: SellerAccount;
    email_verified?: boolean;
    is_buyer?: boolean;
    is_seller?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  