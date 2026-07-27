/**
 * Gamification contract types — mirror the backend Marshmallow schemas
 * (markt_python app/gamification/schemas.py). Read-only models; mutations are
 * limited to the leaderboard opt-out preference.
 */

export type TierKey =
  | "newcomer"
  | "hustler"
  | "trader"
  | "merchant"
  | "magnate"
  | "mogul";

export type LeaderboardScope = "global" | "buyers" | "sellers";
export type LeaderboardPeriod = "alltime" | "weekly";

export interface Tier {
  key: TierKey;
  name: string;
  stars: number; // 0..5
  color_hex: string;
  progress_to_next: number; // 0..1
  points_to_next_tier: number;
}

export interface WeeklyRank {
  scope: string;
  rank: number;
  out_of: number;
}

export interface GamMe {
  user_id: string;
  lifetime_points: number;
  available_points: number;
  weekly_points: number;
  tier: Tier;
  badges_earned: number;
  badges_total: number;
  weekly_rank: WeeklyRank | null;
  opt_out_leaderboard: boolean;
}

export interface Badge {
  slug: string;
  name: string;
  description?: string | null;
  icon_url?: string | null;
  category?: string | null;
  audience: string; // "S" | "B" | "BS"
  priority: number;
}

export interface UserBadge extends Badge {
  earned: boolean;
  awarded_at?: string | null;
  progress: number; // 0..1
}

export interface PublicGamProfile {
  user_id: string;
  lifetime_points: number;
  tier: Tier;
  badges: Badge[];
}

export interface PointsHistoryItem {
  id: number;
  delta: number;
  reason: string;
  ref_type?: string | null;
  ref_id?: string | null;
  balance_after: number;
  created_at: string;
}

export interface PointsHistoryResponse {
  items: PointsHistoryItem[];
  next_cursor: number | null;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  points: number;
  username?: string | null;
  profile_picture?: string | null;
  tier?: TierKey | null;
  stars?: number | null;
}

export interface LeaderboardRank {
  scope: string;
  period: string;
  rank: number;
  points: number;
  out_of: number;
}

export interface LeaderboardResponse {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  items: LeaderboardRow[];
  next_cursor: number | null;
  your_rank: LeaderboardRank | null;
}

export interface TierConfig {
  tier: TierKey;
  name: string;
  min_lifetime_points: number;
  color_hex: string;
  star_count: number;
}

export interface UserBadgesResponse {
  items: UserBadge[];
}

// --- Realtime event payloads (Socket.IO /notification) ---
export interface PointsAwardedEvent {
  delta: number;
  reason: string;
  new_balance: number;
}

export interface BadgeEarnedEvent {
  badge: {
    slug: string;
    name: string;
    icon_url?: string | null;
    description?: string | null;
  };
}

export interface TierChangedEvent {
  old_tier: TierKey;
  new_tier: TierKey;
  stars: number;
}
