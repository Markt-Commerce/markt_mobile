// /services/requestService.ts
import { request, BASE_URL } from "../api";
import { CreateRequestPayload, Request, RequestResponse } from "../../models/request";
import { ApiResponse } from "../../models/auth";

/**
 * Create a buyer request (visible to sellers)
 */
export async function createBuyerRequest(payload: CreateRequestPayload): Promise<RequestResponse> {
  const res = await request<ApiResponse<RequestResponse>>(`${BASE_URL}/requests`, {
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
