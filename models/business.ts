// Markt Business — mirrors the backend's /api/v1/business schemas
// (markt_python app/business/schemas.py).

export interface BusinessOption {
  key: string;
  label: string;
}

export interface BusinessFeatures {
  enabled: boolean;
  registration_enabled: boolean;
  discovery_enabled: boolean;
  procurement_enabled: boolean;
  subscriptions_enabled: boolean;
  verification_enabled: boolean;
}

export interface BusinessConfig {
  features: BusinessFeatures;
  business_types: BusinessOption[];
  industries: BusinessOption[];
  units: BusinessOption[];
}

export type BusinessVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface BusinessProfile {
  user_id: string;
  username?: string;
  name: string;
  description?: string | null;
  business_types: string[];
  industry?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  /** Only on your own profile; the public one leaves it out. */
  registration_number?: string | null;
  verification_status: BusinessVerificationStatus;
  /** Has a buyer account: can post procurement requests. */
  buys: boolean;
  /** Has a seller account: can list products. */
  sells: boolean;
  shop_slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MyBusiness {
  /** Effective: the tag, plus a subscription while subscriptions are on. */
  is_business: boolean;
  business_tag: boolean;
  /** Tag set but not entitled — only possible while subscriptions are on. */
  requires_subscription: boolean;
  profile: BusinessProfile | null;
}

export type BusinessProfileInput = Pick<
  BusinessProfile,
  | "name"
  | "description"
  | "business_types"
  | "industry"
  | "contact_email"
  | "contact_phone"
  | "website"
  | "address"
  | "city"
  | "state"
  | "country"
  | "registration_number"
>;

export interface BusinessListing {
  product_id: string;
  unit: string;
  available_quantity?: number | null;
  min_order_quantity?: number | null;
  price_negotiable: boolean;
  production_capacity?: string | null;
  availability?: string | null;
  specifications?: Record<string, string> | null;
  city?: string | null;
  state?: string | null;
  updated_at?: string;
}

export type BusinessListingInput = Omit<BusinessListing, "product_id" | "updated_at">;

export interface BusinessListingResult {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  business_listing: BusinessListing;
  seller_user_id?: string | null;
  business_name?: string | null;
}

export interface Page<T> {
  items: T[];
  pagination: { page: number; per_page: number; total_items: number; total_pages: number };
}

export interface SubscriptionPlan {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billing_interval: string;
  features: { feature_key: string; limit_value?: number | null }[];
}

export interface MySubscription {
  id: number;
  status: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  start_date?: string | null;
  end_date?: string | null;
  renewal_date?: string | null;
  plan: SubscriptionPlan;
}

/** Markt Business procurement fields on a buyer request. Optional everywhere. */
export interface ProcurementFields {
  is_business?: boolean;
  quantity?: number | null;
  unit?: string | null;
  specifications?: Record<string, string> | null;
  delivery_location?: string | null;
  required_delivery_date?: string | null;
}

/**
 * What the app assumes when the config endpoint can't be reached: the
 * backend's own defaults — business on, subscriptions off. Lookup lists are
 * empty, so forms that need them say so instead of guessing at values the
 * backend may reject.
 */
export const FALLBACK_BUSINESS_CONFIG: BusinessConfig = {
  features: {
    enabled: true,
    registration_enabled: true,
    discovery_enabled: true,
    procurement_enabled: true,
    subscriptions_enabled: false,
    verification_enabled: false,
  },
  business_types: [],
  industries: [],
  units: [],
};

export function optionLabel(options: BusinessOption[], key: string | null | undefined): string {
  if (!key) return "";
  return options.find((o) => o.key === key)?.label ?? key;
}

/** "per tonne": every label in the backend's unit list is a plain -s plural. */
export function unitSingular(units: BusinessOption[], unit: string | null | undefined): string {
  return optionLabel(units, unit).toLowerCase().replace(/s$/, "");
}

/** "20 tonnes". Empty when there is no quantity. */
export function formatQuantity(
  quantity: number | null | undefined,
  unit: string | null | undefined,
  units: BusinessOption[]
): string {
  if (quantity === null || quantity === undefined) return "";
  const label = unit ? optionLabel(units, unit).toLowerCase() : "";
  return `${Number(quantity).toLocaleString("en-NG", { maximumFractionDigits: 3 })}${label ? ` ${label}` : ""}`;
}
