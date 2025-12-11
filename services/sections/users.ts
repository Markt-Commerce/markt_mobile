import { CommonSellerResponseData, ShopData, User } from "../../models/user";
import { request, BASE_URL } from "../api";


// Fetch public profile
export async function getUserPublicProfile(user_id: string): Promise<any> {
  const res = await request<{ items: any[] }>(
    `${BASE_URL}/users/${user_id}/public`,
    { method: "GET" }
  );
  return res;
}

//get shop information
export async function getUserShopInfo(user_id: string): Promise<ShopData> {
  const res = await request<ShopData>(
    `${BASE_URL}/users/shops/${user_id}`,
    { method: "GET" }
  );
  return res;
}

export async function getSellerFollowersCount(seller_id: string): Promise<{ count: number }> {
  const res = await request<{ follower_count: number }>(
    `${BASE_URL}/users/sellers/${seller_id}/followers/count`,
    { method: "GET" }
  );
  return { count: res.follower_count };
}

export async function getSellerFollowers(seller_id: string): Promise<User[]> {
  const res = await request<{ items: User[] }>(
    `${BASE_URL}/users/sellers/${seller_id}/followers`,
    { method: "GET" }
  );
  return res.items;
}