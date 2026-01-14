import { BankOrCardAuthorization, InitializeResponse, PaymentInit, Transaction } from "../../models/payments";
import { BASE_URL, request } from "../api";

export const getPaymentMethods = async () => {
  try {
    const response = await request(`${BASE_URL}/payment-methods`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

/**
 * This is done first before verifying and completing a payment
 * essentially before anything is started or processed
 * @param paymentData 
 * @returns 
 */
export const initiatePayment = async (paymentData: PaymentInit): Promise<Transaction> => {
  try {
    const response = await request<Transaction>(`${BASE_URL}/payments/create`, {
        method: "POST",
        body: JSON.stringify(paymentData),
      });
    return response;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw error;
  }
};

export const initializePayment = async (paymentData: PaymentInit): Promise<InitializeResponse> => {
  try {
    paymentData.method = "card"; // Ensure method is set to card for this 
    const response = await request<InitializeResponse>(`${BASE_URL}/payments/initialize`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    return response;
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error;
  }
};

export const processPayment = async (paymentId: string, paymentData: BankOrCardAuthorization): Promise<Transaction> => {
  try {
    const response = await request(`${BASE_URL}/payments/${paymentId}/process`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    return response.data;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

export const verifyPayment = async (paymentId: string) => {
  try {
    const response = await request(`${BASE_URL}/payments/${paymentId}/verify`);
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};
