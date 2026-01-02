export interface PaymentPayload {
  bank: {
    [key: string]: string;
  };
  authorization_code: string;
  card_token: string;
  metadata: Record<string, any>;
}

export interface Transaction {
  method: string;
  transaction_id: string;
  gateway_response: {
    [key: string]: string;
  };
  currency: string;
  created_at: string;   // ISO date string
  status: string;
  paid_at: string;      // ISO date string
  order_id: string;
  updated_at: string;   // ISO date string
  id: string;
  amount: number;
}

export interface PaymentInit {
  method: "card" | "bank_transfer";
  currency: string;      // e.g. "NGN"
  order_id: string;
  metadata: Record<string, any>;
  amount: number;
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
