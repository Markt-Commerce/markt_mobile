// /services/requestService.ts
import { request, BASE_URL } from "../api";
import { CreateRequestPayload, Request, RequestResponse } from "../../models/request";
import { ApiResponse } from "../../models/auth";
import { BuyerRequest } from "../../models/feed";
import type { Page } from "../../models/business";

/**
 * Open Markt Business procurement requests (requests posted by business
 * accounts), for suppliers to respond to.
 */
export async function getOpenProcurementRequests(search?: string): Promise<Page<Request>> {
  const q = new URLSearchParams({ is_business: "true", status: "OPEN", per_page: "50" });
  if (search?.trim()) q.set("search", search.trim());
  return request<Page<Request>>(`${BASE_URL}/requests/?${q}`, { method: "GET" });
}

/**
 * Send an offer on a request (seller accounts). `proposed_quantity` is for
 * procurement requests: how much of the requested quantity you can supply.
 */
export async function createRequestOffer(
  requestId: string,
  body: { price: number; message?: string; proposed_quantity?: number }
): Promise<void> {
  await request(`${BASE_URL}/requests/${encodeURIComponent(requestId)}/offers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Create a buyer request (visible to sellers)
 */
export async function createBuyerRequest(payload: CreateRequestPayload): Promise<RequestResponse> {
  const res = await request<ApiResponse<RequestResponse>>(`${BASE_URL}/requests/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (res as any).data ?? (res as any);
}

/**
 * Get details of a specific request by ID
 */
export async function getRequestDetails(id: string): Promise<Request> {
  const res = await request<ApiResponse<Request>>(`${BASE_URL}/requests/${id}`, {
    method: "GET",
  });
  return (res as any).data ?? (res as any);
}


/**
 * Get the current buyer's own requests.
 * Tolerates the paginated `{items: [...]}` shape, a bare array, or an
 * ApiResponse-style `{data: [...]}` wrapper.
 */
export async function getMyRequests(): Promise<BuyerRequest[]> {
  const res = await request<any>(`${BASE_URL}/requests/my-requests`, {
    method: "GET",
  });
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
}