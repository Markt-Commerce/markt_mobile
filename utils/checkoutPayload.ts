import type { CheckoutRequest, ShippingAddressPayload } from "../models/cart";
import type {
  CheckoutPaymentInitRequest,
  FulfilmentPreference,
} from "../models/payments";
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
  notes = "Checkout from mobile",
  deliveryQuoteId?: string,
  batchOptIn = false
): CheckoutRequest {
  return {
    shipping_address: shipping,
    billing_address: shippingToBilling(shipping),
    notes,
    use_saved_address: false,
    idempotency_key: getOrCreateIdempotencyKey("checkout-cart"),
    // batch_opt_in only travels with a quote: sharing a run is priced
    // against the solo quote, so without one there is no ceiling to cap
    // the shared fee at and the opt-in would mean nothing.
    ...(deliveryQuoteId
      ? { delivery_quote_id: deliveryQuoteId, batch_opt_in: batchOptIn }
      : {}),
  };
}

/** Payment-first checkout (POST /payments/checkout/initialize): reserves
 * stock and starts payment before any Order exists. */
export function buildCheckoutPaymentInitRequest(
  shipping: ShippingAddressPayload,
  fulfilmentPreference: FulfilmentPreference,
  reliabilityFeeOptedIn: boolean,
  deliveryQuoteId?: string
): CheckoutPaymentInitRequest {
  return {
    shipping_address: shipping,
    use_saved_address: false,
    platform: "mobile",
    reliability_fee_opted_in: reliabilityFeeOptedIn,
    fulfilment_preference: fulfilmentPreference,
    idempotency_key: getOrCreateIdempotencyKey("checkout-cart"),
    // Omitted rather than sent as undefined when there is no quote: the
    // server treats absence as "use the flat estimate", which is what keeps
    // an older build (or a failed quote) working.
    ...(deliveryQuoteId ? { delivery_quote_id: deliveryQuoteId } : {}),
  };
}
