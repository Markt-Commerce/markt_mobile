/**
 * Gamification API client (backend: /api/v1/gamification, spec §5.5).
 * All reads; the only mutation is the leaderboard opt-out preference.
 */
import { request, BASE_URL } from "../api";
import type {
  GamMe,
  PublicGamProfile,
  UserBadgesResponse,
  Badge,
  PointsHistoryResponse,
  LeaderboardResponse,
  LeaderboardScope,
  LeaderboardPeriod,
  TierConfig,
} from "../../types/gamification";

/** GET /gamification/me — current user's stats, tier, badge count, weekly rank. */
export async function getMyGamification(): Promise<GamMe> {
  return request<GamMe>(`${BASE_URL}/gamification/me`, { method: "GET" });
}

/** GET /gamification/users/{id}/profile — public gamification profile. */
export async function getUserGamification(userId: string): Promise<PublicGamProfile> {
  return request<PublicGamProfile>(
    `${BASE_URL}/gamification/users/${userId}/profile`,
    { method: "GET" }
  );
}

/** GET /gamification/users/{id}/badges — badges held + progress on locked ones. */
export async function getUserBadges(userId: string): Promise<UserBadgesResponse> {
  return request<UserBadgesResponse>(
    `${BASE_URL}/gamification/users/${userId}/badges`,
    { method: "GET" }
  );
}

/** GET /gamification/badges — full active catalog. */
export async function getBadgeCatalog(): Promise<Badge[]> {
  const res = await request<{ items: Badge[] }>(`${BASE_URL}/gamification/badges`, {
    method: "GET",
  });
  return res.items ?? [];
}

/** GET /gamification/points/history — cursor-paginated ledger for the current user. */
export async function getPointsHistory(
  cursor?: number | null,
  limit = 20
): Promise<PointsHistoryResponse> {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (cursor != null) q.set("cursor", String(cursor));
  return request<PointsHistoryResponse>(
    `${BASE_URL}/gamification/points/history?${q}`,
    { method: "GET" }
  );
}

/** GET /gamification/leaderboard — ranked list with the user's own row pinned. */
export async function getLeaderboard(params: {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  cursor?: number | null;
  limit?: number;
}): Promise<LeaderboardResponse> {
  const { scope, period, cursor, limit = 50 } = params;
  const q = new URLSearchParams();
  q.set("scope", scope);
  q.set("period", period);
  q.set("limit", String(limit));
  if (cursor != null) q.set("cursor", String(cursor));
  return request<LeaderboardResponse>(
    `${BASE_URL}/gamification/leaderboard?${q}`,
    { method: "GET" }
  );
}

/** GET /gamification/tiers — tier configuration for client-side display. */
export async function getTiers(): Promise<TierConfig[]> {
  return request<TierConfig[]>(`${BASE_URL}/gamification/tiers`, { method: "GET" });
}

/** PATCH /gamification/me/preferences — toggle leaderboard opt-out. */
export async function updateGamificationPreferences(data: {
  opt_out_leaderboard?: boolean;
}): Promise<{ opt_out_leaderboard: boolean }> {
  return request<{ opt_out_leaderboard: boolean }>(
    `${BASE_URL}/gamification/me/preferences`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}
