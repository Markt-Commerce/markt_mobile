// types.ts
export type AccountType = 'buyer' | 'seller';

export interface RegisterRequest {
  username: string;
  phone_number: string;
  password: string;
  account_type: AccountType;
  email: string;
  seller_data?: {
    policies: Record<string, string>;
    description: string;
    shop_name: string;
    category_ids: number[];
  };
  buyer_data?: {
    shipping_address: Record<string, string>;
    buyername: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  account_type: AccountType;
}

//will discuss with backend team about this. There is currently no standardized response format in the backend
export interface ApiResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  errors?: Record<string, string>;
  data?: T;
}

export interface AuthUser {
  username: string;
  phone_number: string;
  profile_picture: string;
  profile_picture_url: string;
  id: string;
  email: string;
  is_buyer: boolean;
  is_seller: boolean;
  email_verified: boolean;
  current_role: string;
  created_at: string;
  updated_at: string;
  account_type: AccountType;
}
