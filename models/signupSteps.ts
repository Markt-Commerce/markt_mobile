import { AccountType, RegisterRequest } from './auth'
import { useState, createContext, useContext } from 'react';


//this context would be available to all the signup steps/components that need it to fill them up and get info
const registerContext = createContext<{
  regData: RegisterRequest;
  setRegData: React.Dispatch<React.SetStateAction<RegisterRequest>>;
} | null>(null);


//will also use later
export const RegisterProvider = registerContext.Provider;

export const useRegData = () => {
  const context = useContext(registerContext);
  if (!context) {
    throw new Error('useRegister must be used within a RegisterProvider');
  }
  return context;
};


export interface SignupStepOne extends Pick<RegisterRequest, 'email' | 'password' | 'username' |'account_type'> {}

export interface SignupStepTwo extends Pick<RegisterRequest,  'phone_number' | 'buyer_data' | 'seller_data'> {}

//export interface SignupStepThree extends SignupStep, Pick<RegisterRequest, > {}

//will use this later to track signup state and complete steps
interface SignupStep {
  step: number;
  isCompleted: boolean;
  isActive: boolean;
  data: SignupStepOne | SignupStepTwo; // or any other step data
}

export const register = (regData:RegisterRequest,data: SignupStepOne | SignupStepTwo) => {
  return Object.assign(
    regData,
    Object.fromEntries(
      Object.entries(data).filter(([key]) => key in regData)
    )
  );
};

