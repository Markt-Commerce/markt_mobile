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

  export interface UserAuthType{
    email: string;
    password: string;
    userType: "buyer" | "seller";
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

  export interface AddressData{
    country: string,
    latitude: number,
    street: string,
    postal_code: string,
    city: string,
    longitude: number,
    house_number: string,
    state: string
  }
  
  export interface CommonBuyerResponseData {
    pending_orders: number,
    id: number,
    buyername: string,
    created_at: string,
    shipping_address: Record<string,string>,
    total_orders: number,
    is_active: boolean,
    last_order_date: string
  }

  export interface CommonSellerResponseData {
    joined_date: string,
    average_rating: number,
    description: string,
    id: number,
    total_products: number,
    total_sales: number,
    policies: Record<string,string>,
    total_raters: number,
    shop_slug: string,
    verification_status: string,
    categories: string,
    shop_name: string,
    is_active: boolean,
    total_rating: number
  }