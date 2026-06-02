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
  gateway_response: {
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


export interface InitializeResponse {
    access_code: string,
    authorization_url: string,
    payment_id: string,
    reference: string
}