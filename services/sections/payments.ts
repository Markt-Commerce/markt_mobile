import {
  BankOrCardAuthorization,
  CheckoutPaymentInitRequest,
  CheckoutPaymentInitResponse,
  InitializeResponse,
  PaymentInit,
  Transaction,
  VerifyPaymentResponse,
} from "../../models/payments";
import { BASE_URL, request } from "../api";
import { unwrapApi } from "../../utils/apiUnwrap";

/** POST /payments/create — card, bank_transfer, wallet (instant when wallet). */
export const createPayment = async (paymentData: PaymentInit): Promise<Transaction> => {
  const body: Record<string, unknown> = {
    order_id: paymentData.order_id,
    currency: paymentData.currency ?? "NGN",
    method: paymentData.method,
    metadata: { platform: "mobile", ...paymentData.metadata },
  };
  if (paymentData.amount != null) body.amount = paymentData.amount;
  if (paymentData.idempotency_key) body.idempotency_key = paymentData.idempotency_key;

  const response = await request<Transaction | { data: Transaction }>(
    `${BASE_URL}/payments/create`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return unwrapApi(response);
};

export const getPaymentDetails = async (paymentId: string): Promise<Transaction> => {
  const response = await request<Transaction | { data: Transaction }>(
    `${BASE_URL}/payments/${paymentId}`,
    { method: "GET" }
  );
  return unwrapApi(response);
};

/** POST /payments/initialize — preferred for Paystack card/bank WebView flow. */
export const initializePayment = async (
  paymentData: PaymentInit
): Promise<InitializeResponse> => {
  const body: Record<string, unknown> = {
    order_id: paymentData.order_id,
    currency: paymentData.currency ?? "NGN",
    method: paymentData.method,
    metadata: { platform: "mobile", ...paymentData.metadata },
  };
  if (paymentData.amount != null) body.amount = paymentData.amount;
  if (paymentData.idempotency_key) body.idempotency_key = paymentData.idempotency_key;

  const response = await request<InitializeResponse | { data: InitializeResponse }>(
    `${BASE_URL}/payments/initialize`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return unwrapApi(response);
};

export const processPayment = async (
  paymentId: string,
  paymentData: BankOrCardAuthorization
): Promise<Transaction> => {
  const response = await request<Transaction | { data: Transaction }>(
    `${BASE_URL}/payments/${paymentId}/process`,
    { method: "POST", body: JSON.stringify(paymentData) }
  );
  return unwrapApi(response);
};

/** POST /payments/checkout/initialize — payment-first checkout: reserves
 * stock and starts payment before any Order exists. The Order is created
 * only once payment succeeds (see verifyPayment's order_id). */
export const initializeCheckoutPayment = async (
  checkoutData: CheckoutPaymentInitRequest
): Promise<CheckoutPaymentInitResponse> => {
  const body: Record<string, unknown> = {
    shipping_address: checkoutData.shipping_address,
    use_saved_address: checkoutData.use_saved_address ?? false,
    platform: checkoutData.platform ?? "mobile",
    reliability_fee_opted_in: checkoutData.reliability_fee_opted_in ?? false,
    fulfilment_preference: checkoutData.fulfilment_preference ?? "auto",
  };
  if (checkoutData.idempotency_key) body.idempotency_key = checkoutData.idempotency_key;

  const response = await request<
    CheckoutPaymentInitResponse | { data: CheckoutPaymentInitResponse }
  >(`${BASE_URL}/payments/checkout/initialize`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return unwrapApi(response);
};

export const verifyPayment = async (
  paymentId: string
): Promise<VerifyPaymentResponse> => {
  const response = await request<
    VerifyPaymentResponse | { data: VerifyPaymentResponse }
  >(`${BASE_URL}/payments/${paymentId}/verify`, { method: "GET" });
  return unwrapApi(response);
};

/** @deprecated Use initializePayment or createPayment instead. */
export const initiatePayment = createPayment;
