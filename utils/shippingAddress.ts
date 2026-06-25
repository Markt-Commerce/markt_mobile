import type { ShippingAddressPayload } from "../models/cart";
import type { UserProfile } from "../models/profile";

/** A shipping address is usable for checkout if it has a full postal address, or at least coordinates. */
export function isShippingAddressUsable(addr: ShippingAddressPayload | null | undefined): boolean {
  if (!addr) return false;
  const hasFullAddress = !!(addr.street_address?.trim() && addr.city?.trim() && addr.country?.trim());
  const hasCoords = typeof addr.latitude === "number" && typeof addr.longitude === "number";
  return hasFullAddress || hasCoords;
}

/** Pulls a usable shipping address off the user's profile (buyer's saved shipping address, falling back to their general address). Returns null if neither has enough to ship to. */
export function mapProfileToShippingAddress(profile: UserProfile | null | undefined): ShippingAddressPayload | null {
  if (!profile) return null;

  const buyerAddr = (profile.buyer_account?.shipping_address ?? {}) as Record<string, any>;
  const generalAddr = (profile.address ?? {}) as Record<string, any>;

  const pick = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

  const mapped: ShippingAddressPayload = {
    recipient_name: pick(buyerAddr.recipient_name, profile.buyer_account?.buyername, profile.username),
    street_address: pick(buyerAddr.street_address, buyerAddr.street, generalAddr.street),
    city: pick(buyerAddr.city, generalAddr.city),
    state: pick(buyerAddr.state, generalAddr.state),
    postal_code: pick(buyerAddr.postal_code, buyerAddr.zip, generalAddr.postal_code),
    country: pick(buyerAddr.country, generalAddr.country),
    latitude: pick(buyerAddr.latitude, generalAddr.latitude),
    longitude: pick(buyerAddr.longitude, generalAddr.longitude),
  };

  return isShippingAddressUsable(mapped) ? mapped : null;
}
