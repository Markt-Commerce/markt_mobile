import { request, BASE_URL } from "../api";
import type { SavedAddress, SavedAddressInput } from "../../models/addresses";

/** Default first, then most recently used — the server orders it, because
 * the address someone wants is nearly always the one they used last. */
export async function listAddresses(): Promise<SavedAddress[]> {
  return request<SavedAddress[]>(`${BASE_URL}/users/addresses`, { method: "GET" });
}

export async function createAddress(data: SavedAddressInput): Promise<SavedAddress> {
  return request<SavedAddress>(`${BASE_URL}/users/addresses`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  id: number,
  data: Partial<SavedAddressInput>
): Promise<SavedAddress> {
  return request<SavedAddress>(`${BASE_URL}/users/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: number): Promise<void> {
  await request<void>(`${BASE_URL}/users/addresses/${id}`, { method: "DELETE" });
}
