import { AccountType, RegisterRequest } from './auth'
import { useState, createContext, useContext } from 'react';


//this context would be available to all the signup steps/components that need it to fill them up and get info
const registerContext = createContext<RegisterRequest>({} as RegisterRequest);

export const RegisterProvider = registerContext.Provider;


interface SignupStep {
  step: number;
  isCompleted: boolean;
  isActive: boolean;
}

export const useRegData = () => {
  const context = useContext(registerContext);
  if (!context) {
    throw new Error('useRegister must be used within a RegisterProvider');
  }
  return context;
};


export interface SignupStepOne extends SignupStep, Pick<RegisterRequest, 'email' | 'password' | 'username' |'account_type'> {}

export interface SignupStepTwo extends SignupStep, Pick<RegisterRequest,  'phone_number' | 'buyer_data' | 'seller_data'> {}

//export interface SignupStepThree extends SignupStep, Pick<RegisterRequest, > {}

export const useRegister = (data: SignupStepOne | SignupStepTwo) => {
};
