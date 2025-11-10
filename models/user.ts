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


  export interface ShopData {
  average_rating: number;
  categories: Category[];
  description: string;
  id: number;
  is_active: boolean;
  policies: Policies;
  recent_posts: Post[];
  recent_products: Product[];
  shop_name: string;
  shop_slug: string | null;
  stats: Stats;
  total_raters: number;
  total_rating: number;
  user: User;
  verification_status: "unverified" | "verified" | string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Policies {
  returns: string;
  shipping: string;
  warranty: string;
}

export interface Post {
  caption: string;
  comments_count: number;
  created_at: string;
  id: string;
  likes_count: number;
  media: Media[];
}

export interface Media {
  alt_text: string | null;
  type: "image" | "video" | string;
  url: string;
}

export interface Product {
  id: string;
  image: string | null;
  name: string;
  price: number;
}

export interface Stats {
  follower_count: number;
  post_count: number;
  product_count: number;
}

export interface User {
  id: string;
  profile_picture: string;
  username: string;
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