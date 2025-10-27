
/**
 * Represents the progress of a seller's onboarding step.
 * The structure may vary depending on the onboarding stage.
 */
export interface SellerStartCardProgress {
  [key: string]: any;
}

/**
 * Represents a call-to-action (CTA) object for a seller's onboarding card.
 */
export interface SellerStartCardCTA {
  label: string;
  href: string;
}

/**
 * Represents a single onboarding step or status card for a seller.
 */
export interface SellerStartCard {
  progress: SellerStartCardProgress;
  description: string;
  cta: SellerStartCardCTA;
  key: string;
  completed: boolean;
  title: string;
}

/**
 * Metadata associated with the onboarding start cards.
 */
export interface SellerStartCardMetadata {
  generated_at: string;
  seller_id: number;
}

/**
 * Response object for seller onboarding start cards.
 */
export interface SellerStartCardsResponse {
  items: SellerStartCard[];
  metadata: SellerStartCardMetadata;
}

/**
 * Overview analytics data for a seller.
 */
export interface SellerAnalyticsOverview {
  views_30d: number;
  revenue_30d: number;
  conversion_30d: number;
  orders_30d: number;
}

/**
 * Represents a single data point in the analytics timeseries.
 */
export interface SellerAnalyticsSeriesPoint {
  value: number;
  bucket_start: string;
}

/**
 * Totals for the selected metric in the analytics timeseries.
 */
export interface SellerAnalyticsTotals {
  count: number;
  value: number;
}

/**
 * Timeseries analytics data for a seller.
 */
export interface SellerAnalyticsTimeseries {
  totals: SellerAnalyticsTotals;
  bucket: string;
  series: SellerAnalyticsSeriesPoint[];
  metric: string;
}
