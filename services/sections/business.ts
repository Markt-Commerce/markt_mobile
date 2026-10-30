/**
 * Markt Business API (/api/v1/business).
 *
 * The config call is the only place business and subscription visibility is
 * decided — the app keeps no flags of its own. Everything else is the
 * signed-in user's business profile, B2B listings, discovery and (only while
 * the backend has them on) subscriptions.
 */

import { request, BASE_URL } from "../api";
import type {
  BusinessConfig,
  BusinessListing,
  BusinessListingInput,
  BusinessListingResult,
  BusinessProfile,
  BusinessProfileInput,
  MyBusiness,
  MySubscription,
  Page,
  SubscriptionPlan,
} from "../../models/business";

function query(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getBusinessConfig(): Promise<BusinessConfig> {
  return request<BusinessConfig>(`${BASE_URL}/business/config`, { method: "GET" });
}

export async function getMyBusiness(): Promise<MyBusiness> {
  return request<MyBusiness>(`${BASE_URL}/business/me`, { method: "GET" });
}

/** Creates or updates the profile and sets the is_business tag. */
export async function saveBusinessProfile(body: BusinessProfileInput): Promise<MyBusiness> {
  return request<MyBusiness>(`${BASE_URL}/business/me`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** Clears the tag; the profile is kept. */
export async function disableBusiness(): Promise<MyBusiness> {
  return request<MyBusiness>(`${BASE_URL}/business/me`, { method: "DELETE" });
}

export async function discoverBusinesses(filters: {
  search?: string;
  businessType?: string;
  industry?: string;
  state?: string;
  side?: "buys" | "sells";
  page?: number;
}): Promise<Page<BusinessProfile>> {
  return request<Page<BusinessProfile>>(
    `${BASE_URL}/business/discover${query({
      search: filters.search,
      business_type: filters.businessType,
      industry: filters.industry,
      state: filters.state,
      side: filters.side,
      page: filters.page,
    })}`,
    { method: "GET" }
  );
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfile> {
  return request<BusinessProfile>(`${BASE_URL}/business/${encodeURIComponent(userId)}`, { method: "GET" });
}

export async function searchListings(filters: {
  search?: string;
  unit?: string;
  state?: string;
  sellerUserId?: string;
  page?: number;
  perPage?: number;
}): Promise<Page<BusinessListingResult>> {
  return request<Page<BusinessListingResult>>(
    `${BASE_URL}/business/listings${query({
      search: filters.search,
      unit: filters.unit,
      state: filters.state,
      seller_user_id: filters.sellerUserId,
      page: filters.page,
      per_page: filters.perPage,
    })}`,
    { method: "GET" }
  );
}

export async function getListing(productId: string): Promise<BusinessListing> {
  return request<BusinessListing>(`${BASE_URL}/business/listings/${encodeURIComponent(productId)}`, {
    method: "GET",
  });
}

export async function saveListing(productId: string, body: BusinessListingInput): Promise<BusinessListing> {
  return request<BusinessListing>(`${BASE_URL}/business/listings/${encodeURIComponent(productId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function removeListing(productId: string): Promise<void> {
  await request(`${BASE_URL}/business/listings/${encodeURIComponent(productId)}`, { method: "DELETE" });
}

// Both 404 while subscriptions are disabled. Screens check
// config.features.subscriptions_enabled first and never render this UI
// otherwise.
export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return request<SubscriptionPlan[]>(`${BASE_URL}/business/subscriptions/plans`, { method: "GET" });
}

export async function getMySubscription(): Promise<MySubscription> {
  return request<MySubscription>(`${BASE_URL}/business/subscriptions/me`, { method: "GET" });
}
