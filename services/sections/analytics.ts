import { SellerStartCardsResponse, SellerAnalyticsOverview, SellerAnalyticsTimeseries } from '../../models/analytics';
import { BASE_URL, request } from '../api';

/**
 * Fetches the seller's onboarding start cards.
 * These cards indicate the seller's setup progress (ID upload, email verification, etc.).
 * 
 * @returns SellerStartCardsResponse
 */
export async function getSellerStartCards(): Promise<SellerStartCardsResponse> {
  const res = await request<SellerStartCardsResponse>(
    `${BASE_URL}/api/v1/users/sellers/start-cards`
  );
  return res;
}

/**
 * Fetches the general analytics overview for a seller.
 * The window is configurable (default: 30 days).
 * 
 * @param windowDays Number of days for the analytics window (default: 30)
 * @returns SellerAnalyticsOverview
 */
export async function getSellerAnalyticsOverview(windowDays: number = 30): Promise<SellerAnalyticsOverview> {
  const res = await request<SellerAnalyticsOverview>(
    `${BASE_URL}/api/v1/users/sellers/analytics/overview?window_days=${windowDays}`
  );
  return res;
}

/**
 * Fetches the seller's analytics timeseries data.
 * Supports various metrics and time buckets.
 * 
 * @param params Object containing bucket, start_date, end_date, and metric
 * @returns SellerAnalyticsTimeseries
 */
export async function getSellerAnalyticsTimeseries(params: {
  bucket: 'day' | 'week' | 'month';
  start_date: string;
  end_date: string;
  metric: 'sales' | 'orders' | 'views' | 'conversion';
}): Promise<SellerAnalyticsTimeseries> {
  const query = new URLSearchParams(params).toString();
  const res = await request<SellerAnalyticsTimeseries>(
    `${BASE_URL}/api/v1/users/sellers/analytics/timeseries?${query}`
  );
  return res;
}
