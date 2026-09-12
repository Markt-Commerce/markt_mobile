
/**
 * Where this account stands in signup.
 *
 * The server owns this rather than the client inferring it from blank
 * fields: registration now happens on the first screen, so the app can be
 * killed at any point afterwards and has to know where to resume.
 */
export type OnboardingStep =
  | 'verify_email'
  | 'buyer_profile'
  | 'seller_profile';

export interface OnboardingState {
  email_verified: boolean;
  profile_complete: boolean;
  /** null when the account is finished and ready to use. */
  next_step: OnboardingStep | null;
}
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
    /** Where money owed back lands. Absent on older servers; treat as "card". */
    refund_preference?: RefundPreference;
  };

  export interface SellerAccount {
  shop_slug: string;
  total_rating: number;
  is_active: boolean;
  joined_date: string;
  policies: SellerPolicies;
  description: string;
  average_rating: number;
  /** The categories the shop itself is filed under -- serialised as full
   * category objects, not a string. Products carry their own categories
   * separately; these two never move together. */
  categories: { id: number; name: string }[];
  verification_status: 'verified' | 'unverified' | 'pending';
  shop_name: string;
  /** The shop's cover image. Null until the seller uploads one. */
  banner_url: string | null;
  total_products: number;
  total_raters: number;
  id: number;
  total_sales: number;
}

  export interface UserProfile {
  /** What this account still needs before it can be used. */
  onboarding?: OnboardingState;

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

  /**
   * Registration mints a handle when none is sent, and the screen that asks
   * for one now runs after the account exists — so this is where a chosen
   * handle lands. Refused with 409 when taken or reserved.
   */
  username?: string;
}

/** Request body for PATCH /api/v1/users/profile/buyer */
/** Where money owed back should land. "card" sends it to the card that paid,
 * over days; "wallet" is instant and withdrawable. Defaults to "card" — see
 * ADR-002: turning someone's refund into store credit is theirs to choose. */
export type RefundPreference = "card" | "wallet";

export interface UpdateBuyerProfileRequest {
  buyername?: string;
  shipping_address?: ShippingAddress;
  refund_preference?: RefundPreference;
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

/** Body and response for PATCH /api/v1/users/address. */
export interface UserAddress {
  house_number?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}
