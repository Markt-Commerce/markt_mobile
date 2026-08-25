/**
 * Fulfilment API — buyer-facing actions on a pending ASK substitution (6.1, 9.1)
 * and on an escalated item Markt couldn't find a replacement seller for (7.3).
 */

import { request } from "../api";

export interface FulfilmentAllocation {
  id: number;
  order_item_id: number;
  seller_id: number;
  quantity: number;
  status: string;
  seller_response_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export async function approveSubstitution(allocationId: number | string): Promise<FulfilmentAllocation> {
  return request<FulfilmentAllocation>(
    `/fulfilment/allocations/${allocationId}/approve-substitution`,
    { method: "POST" },
  );
}

export async function rejectSubstitution(allocationId: number | string): Promise<FulfilmentAllocation> {
  return request<FulfilmentAllocation>(
    `/fulfilment/allocations/${allocationId}/reject-substitution`,
    { method: "POST" },
  );
}

// 7.3 escalation -- see app.fulfilment.rerouting.get_item_escalation
// (markt_python) for what "escalated" means and why only 3 of the
// spec's 4 options are surfaced (no cross-market-with-fee option yet).
export interface EscalationOffer {
  id: number;
  seller_id: number;
  seller_name: string | null;
  product_id: string | null;
  price: number;
  message: string | null;
  status: string;
}

export interface EscalationRerouteRequest {
  id: string;
  status: string;
  expires_at: string | null;
  offers: EscalationOffer[];
}

export interface ItemEscalation {
  order_item_id: number;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  item_status: string;
  escalated: boolean;
  reroute_request: EscalationRerouteRequest | null;
}

export async function getItemEscalation(orderItemId: number | string): Promise<ItemEscalation> {
  return request<ItemEscalation>(`/orders/items/${orderItemId}/escalation`, {
    method: "GET",
  });
}

export async function removeEscalatedItem(
  orderItemId: number | string,
  reason?: string,
): Promise<{ order_item_id: number; status: string }> {
  return request(`/orders/items/${orderItemId}/escalation/remove`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
