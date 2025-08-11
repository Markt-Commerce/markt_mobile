import { AccountType } from './auth';

export interface UpdateSellerRequest {
    shop_name?: string;
    policies?: Record<string, string>;
    category_ids?: number[];
    description?: string;
}

export interface SwitchRoleRequest {
    account_type: AccountType;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirmRequest {
    email: string;
    password: string;
    confirm_password: string;
    token: string;
}

export interface EmailVerificationRequest {
    email: string;
}


export interface EmailVerificationConfirmRequest {
    email: string;
    token: string;
}

