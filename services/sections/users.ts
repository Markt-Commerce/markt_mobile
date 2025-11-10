import { CommonSellerResponseData, ShopData } from "../../models/user";
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