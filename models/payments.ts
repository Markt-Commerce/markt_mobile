import { ShippingAddressPayload } from "./cart";

export type PaymentMethod = "card" | "bank_transfer" | "mobile_money" | "wallet";

export type FulfilmentPreference = "auto" | "ask" | "seller_only";

export interface PaymentPayload {
  bank: {
    [key: string]: string;
  };
  authorization_code: string;
  card_token: string;
  metadata: Record<string, any>;
}

export interface GatewayResponseData {
  access_code: string;
  authorization_url: string;
  reference: string;
}

export interface Transaction {
  method: string;
  transaction_id: string;
  gateway_response?: {
    data: GatewayResponseData;
    message: string;
    status: boolean;
  };
  currency: string;
  created_at: string;
  status: string;
  paid_at: string | null;
  order_id: string;
  updated_at: string;
  id: string;
  amount: number;
}

export interface PaymentInit {
  method: PaymentMethod;
  currency: string;
  order_id: string;
  metadata?: Record<string, unknown>;
  /** Omit to let server charge order.total */
  amount?: number;
  idempotency_key?: string;
}

export interface BankOrCardAuthorization {
  bank: {
    [key: string]: string;
  };
  authorization_code: string;
  card_token: string;
  metadata: Record<string, any>;
}

export interface InitializeResponse {
  access_code: string;
  authorization_url: string;
  payment_id: string;
  reference: string;
}

/** POST /payments/checkout/initialize request — payment-first checkout:
 * reserves stock and starts payment before any Order exists. */
export interface CheckoutPaymentInitRequest {
  shipping_address: ShippingAddressPayload;
  use_saved_address?: boolean;
  platform?: string;
  /** Opt-in only; only actually charged if a reroute fires. */
  reliability_fee_opted_in?: boolean;
  fulfilment_preference?: FulfilmentPreference;
  idempotency_key?: string;
}

/** Response for CheckoutPaymentInitRequest — no order_id yet, since the
 * order is only created once payment succeeds. Full itemised breakdown
 * so the client can render it before sending the buyer to Paystack. */
export interface CheckoutPaymentInitResponse {
  payment_id: string;
  authorization_url: string | null;
  reference: string | null;
  access_code: string | null;
  amount: number;
  subtotal: number;
  shipping_fee: number;
  /** How many separate delivery runs this order needs -- one per distinct
   * market among its sellers (1.1/7.3). >1 means shipping_fee covers more
   * than one delivery. */
  delivery_count: number;
  service_fee: number;
  reliability_fee_opted_in: boolean;
  reliability_fee_estimate: number;
  /** Max the buyer could be charged today, informational only — not a
   * PSP authorization hold. */
  capture_ceiling: number;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  amount?: number;
  gateway_response?: Record<string, unknown>;
  already_completed?: boolean;
  /** Present once payment completes. Payment-first checkout has no
   * order until this point, so this is how the client learns it. */
  order_id?: string;
}
