/**
 * Saved posts and wishlisted products.
 *
 * One endpoint for both because the home feed mixes them and the Saved screen
 * shows a single list.
 */

import { BASE_URL, request } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";

export type SavedType = "post" | "product";

export interface SavedToggleResult {
  saved: boolean;
  content_type: SavedType;
  content_id: string;
}

export interface SavedItem {
  content_type: SavedType;
  content_id: string;
  saved_at: string | null;
  title: string | null;
  image_url: string | null;
  price: number | null;
}

export interface SavedItemsPage {
  items: SavedItem[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

/** Saving something already saved is a no-op server-side, not an error. */
export async function saveItem(
  contentType: SavedType,
  contentId: string
): Promise<SavedToggleResult> {
  const res = await request<SavedToggleResult | { data: SavedToggleResult }>(
    `${BASE_URL}/socials/saved`,
    {
      method: "POST",
      body: JSON.stringify({ content_type: contentType, content_id: contentId }),
    }
  );
  return unwrapApi(res);
}

export async function unsaveItem(
  contentType: SavedType,
  contentId: string
): Promise<SavedToggleResult> {
  const res = await request<SavedToggleResult | { data: SavedToggleResult }>(
    `${BASE_URL}/socials/saved/${contentType}/${contentId}`,
    { method: "DELETE" }
  );
  return unwrapApi(res);
}

export async function listSaved(
  page = 1,
  perPage = 20,
  contentType?: SavedType
): Promise<SavedItemsPage> {
  const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (contentType) q.set("content_type", contentType);
  const res = await request<SavedItemsPage | { data: SavedItemsPage }>(
    `${BASE_URL}/socials/saved?${q.toString()}`,
    { method: "GET" }
  );
  const data = unwrapApi(res);
  return {
    items: data?.items ?? [],
    pagination: data?.pagination ?? {
      page,
      per_page: perPage,
      total_items: 0,
      total_pages: 0,
    },
  };
}
