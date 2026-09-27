import { request, BASE_URL } from "../api";

/**
 * Browse location — where the user is *looking*.
 *
 * Deliberately separate from the shipping address: changing where you browse
 * must never change where an order is delivered. The backend keeps them in
 * different tables for the same reason.
 */

export interface BrowseLocation {
  latitude: number;
  longitude: number;
  label?: string | null;
  state?: string | null;
  lga?: string | null;
}

/** Which rung of the backend's fallback ladder answered. */
export type FeedScope = "nearby" | "widened" | "regional" | "nationwide";

export interface NearbyItem {
  id: string;
  name: string;
  price: number | null;
  seller_id: number;
  /** Null when the seller has no shop location, or on the nationwide rung. */
  distance_km: number | null;
}

export interface NearbyFeed {
  items: NearbyItem[];
  scope: FeedScope;
  radius_km: number | null;
  next_cursor: string | null;
}

export async function getBrowseLocation(guestId?: string) {
  const q = guestId ? `?guest_id=${encodeURIComponent(guestId)}` : "";
  return request<BrowseLocation>(`${BASE_URL}/location/browse${q}`, { method: "GET" });
}

export async function setBrowseLocation(
  loc: BrowseLocation & { guest_id?: string }
) {
  return request<BrowseLocation>(`${BASE_URL}/location/browse`, {
    method: "PUT",
    body: JSON.stringify(loc),
  });
}

export async function getNearby(params: {
  latitude?: number;
  longitude?: number;
  guestId?: string;
  limit?: number;
  cursor?: string | null;
}) {
  const q = new URLSearchParams();
  if (params.latitude != null) q.set("latitude", String(params.latitude));
  if (params.longitude != null) q.set("longitude", String(params.longitude));
  if (params.guestId) q.set("guest_id", params.guestId);
  q.set("limit", String(params.limit ?? 20));
  if (params.cursor) q.set("cursor", params.cursor);
  return request<NearbyFeed>(`${BASE_URL}/location/nearby?${q.toString()}`, {
    method: "GET",
  });
}

/**
 * Human copy for a feed that had to widen.
 *
 * Returned rather than rendered so the caller decides where it goes. The point
 * is that a shop 200 km away is never presented as though it were nearby —
 * saying so costs one line and is the difference between a useful fallback and
 * a lie.
 */
export function scopeNotice(feed: Pick<NearbyFeed, "scope" | "radius_km">) {
  switch (feed.scope) {
    case "nearby":
      return null;
    case "widened":
    case "regional":
      return `Nothing within 10 km — showing results up to ${feed.radius_km} km away.`;
    case "nationwide":
      return "Nothing nearby yet — showing sellers from across Nigeria.";
    default:
      return null;
  }
}
