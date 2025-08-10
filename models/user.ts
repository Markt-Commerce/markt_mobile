export interface BuyerProfile {
    buyername: string;
    shipping_address: Record<string, string>;
  }
  
  export interface SellerProfile {
    shop_name: string;
    policies: Record<string, string>;
    category_ids: number[];
    description: string;
  }
  
  export interface UpdateProfileRequest {
    username?: string;
    phone_number?: string;
    email?: string;
    profile_picture?: File | string;
  }
  
  export interface CreateBuyerRequest extends BuyerProfile {}
  
  export interface CreateSellerRequest extends SellerProfile {}
  
  export interface UpdateBuyerRequest {
    buyername?: string;
    shipping_address?: Record<string, string>;
  }
  