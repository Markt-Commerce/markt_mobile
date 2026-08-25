/**
 * Buyer Requests API (7.4) — offer accept/reject on a BuyerRequest.
 * Currently just the two calls the 7.3 escalation screen needs
 * ("choose seller" = accept the offer from the auto-generated reroute
 * request); the rest of the /requests surface (create/list/search) has
 * no mobile screen yet.
 */

import { request } from "../api";

export interface SellerOffer {
  id: number;
  request_id: string;
  seller_id: number;
  product_id: string | null;
  price: number;
  message: string | null;
  status: string;
  created_at: string;
}

export async function acceptRequestOffer(offerId: number | string): Promise<SellerOffer> {
  return request<SellerOffer>(`/requests/offers/${offerId}/accept`, {
    method: "POST",
  });
}

export async function rejectRequestOffer(offerId: number | string): Promise<SellerOffer> {
  return request<SellerOffer>(`/requests/offers/${offerId}/reject`, {
    method: "POST",
  });
}
