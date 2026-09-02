import { CommonSellerResponseData, FollowResponse, ShopData, User } from "../../models/user";
import { request, BASE_URL } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";


export interface PublicShop {
  id: number;
  shop_name: string | null;
  shop_slug: string | null;
  description: string | null;
  products_count: number;
  average_rating: number | null;
  total_raters: number;
  verification_status: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  profile_picture: string | null;
  is_seller: boolean;
  joined_at: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  /** Viewer-relative; false for anonymous callers. */
  is_followed: boolean;
  is_self: boolean;
  shop: PublicShop | null;
}

/**
 * Public view of another user. Was typed `Promise<any>` returning `{items}`,
 * which never matched the endpoint — it was a stub that 500'd until now.
 */
export async function getUserPublicProfile(user_id: string): Promise<PublicProfile> {
  const res = await request<PublicProfile | { data: PublicProfile }>(
    `${BASE_URL}/users/${user_id}/public`,
    { method: "GET" }
  );
  return unwrapApi(res);
}

//get shop information
export async function getUserShopInfo(user_id: string): Promise<ShopData> {
  const res = await request<ShopData>(
    `${BASE_URL}/users/shops/${user_id}`,
    { method: "GET" }
  );
  return res;
}

/* export async function getSellerFollowersCount(seller_id: string): Promise<{ count: number }> {
  const res = await request<{ follower_count: number }>(
    `${BASE_URL}/users/sellers/${seller_id}/followers/count`,
    { method: "GET" }
  );
  return { count: res.follower_count };
} */

/* export async function getSellerFollowers(seller_id: string): Promise<User[]> {
  const res = await request<{ items: User[] }>(
    `${BASE_URL}/users/sellers/${seller_id}/followers`,
    { method: "GET" }
  );
  return res.items;
} */

export async function followSeller(seller_id: string): Promise<FollowResponse> {
  const res = await request<FollowResponse>(
    `${BASE_URL}/socials/follow/${seller_id}`,
    { method: "POST" }
  );
  return res;
}

export async function unfollowSeller(seller_id: string): Promise<void> {
  await request<void>(
    `${BASE_URL}/socials/follow/${seller_id}`,
    { method: "DELETE" }
  );
}