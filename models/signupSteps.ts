import { AccountType, RegisterRequest } from './auth'

interface SignupStep {
  step: number;
  isCompleted: boolean;
  isActive: boolean;
}

export interface SignupStepOne extends SignupStep, Pick<RegisterRequest, 'email' | 'password' | 'account_type'> {}

export interface SignupStepTwo extends SignupStep, Pick<RegisterRequest, 'username' | 'phone_number' | 'buyer_data' | 'seller_data'> {}

//export interface SignupStepThree extends SignupStep, Pick<RegisterRequest, > {}
