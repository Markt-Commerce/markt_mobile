import { AccountType, RegisterRequest } from './auth'
import { useState, createContext, useContext } from 'react';


/**
 * Carries the email (and, on the login bounce, the password) between the
 * signup screen and the verification screen.
 *
 * It used to accumulate the entire registration payload across four screens
 * and POST it at the end, which is why an app kill lost everything and a
 * duplicate email surfaced three screens after the field that caused it.
 * Registration now happens on the first screen, so the rest of the flow
 * writes to the server and this holds only what the code screen needs to
 * display and resend to.
 */
const registerContext = createContext<{
  regData: RegisterRequest;
  setRegData: React.Dispatch<React.SetStateAction<RegisterRequest>>;
} | null>(null);


export const RegisterProvider = registerContext.Provider;

export const useRegData = () => {
  const context = useContext(registerContext);
  if (!context) {
    throw new Error('useRegister must be used within a RegisterProvider');
  }
  return context;
};


export interface SignupStepOne extends Pick<RegisterRequest, 'email' | 'password' |'account_type'> {}

export interface SignupStepTwo extends Pick<RegisterRequest,  'phone_number' | 'username'  | 'buyer_data' | 'seller_data'> {}

//export interface SignupStepThree extends SignupStep, Pick<RegisterRequest, > {}

//will use this later to track signup state and complete steps
interface SignupStep {
  step: number;
  isCompleted: boolean;
  isActive: boolean;
  data: SignupStepOne | SignupStepTwo; // or any other step data
}

export const register = (regData:RegisterRequest,data: SignupStepOne | SignupStepTwo) => {
  const nextData = Object.entries(data).reduce<Partial<RegisterRequest>>((acc, [key, value]) => {
    if (key in regData) {
      (acc as Record<string, unknown>)[key] = value;
    }
    return acc;
  }, {});

  return Object.assign(regData, nextData);
};
