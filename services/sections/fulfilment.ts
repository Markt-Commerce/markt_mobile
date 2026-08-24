/**
 * Fulfilment API — buyer-facing actions on a pending ASK substitution (6.1, 9.1).
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
