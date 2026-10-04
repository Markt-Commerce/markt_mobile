import { request, BASE_URL } from "../api";
import { UserProfile } from "../../models/profile";
import type { GamMe, UnseenAchievements } from "../../types/gamification";

/**
 * GET /users/bootstrap -- everything the app needs on open, in one request.
 *
 * Replaces five start-up calls: /users/profile, the unread-notification
 * count, the cart or seller-pending badge, /gamification/me and the unseen
 * achievements. Each of those endpoints is still what the app uses once it
 * is running.
 *
 * Every section but `profile` can be null, meaning "not available right now,
 * ask the usual endpoint". It is never a stand-in for zero.
 */
export type Bootstrap = {
  profile: UserProfile;
  unread_notifications: number | null;
  /** Buyer mode only. */
  cart_item_count: number | null;
  /** Seller mode only. */
  seller_needs_action: number | null;
  gamification: GamMe | null;
  unseen_achievements: UnseenAchievements | null;
};

export async function getBootstrap(): Promise<Bootstrap> {
  return request<Bootstrap>(`${BASE_URL}/users/bootstrap`, { method: "GET" });
}
