import type { CheckoutRequest, ShippingAddressPayload } from "../models/cart";
import { getOrCreateIdempotencyKey } from "./idempotency";

/** Mirror shipping fields into billing (server accepts same shape without lat/lng). */
export function shippingToBilling(
  addr: ShippingAddressPayload
): Record<string, string> {
  const out: Record<string, string> = {};
  const entries: [keyof ShippingAddressPayload, unknown][] = [
    ["recipient_name", addr.recipient_name],
    ["street_address", addr.street_address],
    ["city", addr.city],
    ["state", addr.state],
    ["postal_code", addr.postal_code],
    ["country", addr.country],
  ];
  for (const [key, value] of entries) {
    if (value != null && String(value).trim() !== "") {
      out[key] = String(value);
    }
  }
  return out;
}

export function buildCheckoutRequest(
  shipping: ShippingAddressPayload,
  notes = "Checkout from mobile"
): CheckoutRequest {
  return {
    shipping_address: shipping,
    billing_address: shippingToBilling(shipping),
    notes,
    use_saved_address: false,
    idempotency_key: getOrCreateIdempotencyKey("checkout-cart"),
  };
}
