import type { ShippingAddressPayload } from "../models/cart";
import type { UserProfile } from "../models/profile";

/**
 * Fields POST /cart/checkout requires (app/orders/shipping.py:
 * REQUIRED_SHIPPING_FIELDS). Keep this list in step with the server -- the two
 * disagreeing is what produced "Checkout failed. Please try again." on a retry
 * that could never succeed.
 *
 * postal_code is deliberately absent: Nigeria rarely uses postcodes and a
 * reverse-geocoded pin usually has none, so the server stopped requiring it.
 */
const REQUIRED_SHIPPING_FIELDS = [
  "recipient_name",
  "street_address",
  "city",
  "state",
  "country",
] as const;

const FIELD_LABELS: Record<string, string> = {
  recipient_name: "recipient name",
  street_address: "street address",
  city: "city",
  state: "state",
  country: "country",
};

/** Which required fields are still blank. Empty array means checkout will pass. */
export function missingShippingFields(
  addr: ShippingAddressPayload | null | undefined
): string[] {
  if (!addr) return REQUIRED_SHIPPING_FIELDS.map((f) => FIELD_LABELS[f]);
  return REQUIRED_SHIPPING_FIELDS.filter(
    (f) => !String((addr as Record<string, unknown>)[f] ?? "").trim()
  ).map((f) => FIELD_LABELS[f]);
}

/**
 * Whether checkout will accept this address.
 *
 * This used to return true for coordinates alone, which the server has never
 * accepted -- so the app enabled "Proceed to Checkout", the server answered 422,
 * and the buyer was told to try again. Coordinates are still sent and still
 * useful for delivery routing; they just aren't sufficient on their own.
 */
export function isShippingAddressUsable(addr: ShippingAddressPayload | null | undefined): boolean {
  return missingShippingFields(addr).length === 0;
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
