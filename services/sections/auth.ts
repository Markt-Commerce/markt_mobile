import { RegisterRequest, LoginRequest, AuthUser, ApiResponse } from '../../models/auth';
import { BASE_URL,request } from '../api';


/**
 * This function registers a new user in the system.
 * Users can be either buyers or sellers, and the registration process
 * varies slightly based on the account type.
 * @param data User registration data
 * @returns 
 */
export async function registerUser(data: RegisterRequest): Promise<AuthUser> {
  const res = await request<AuthUser>(`${BASE_URL}/users/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
}


/**
 * This function logs in a user to the system.
 * It accepts an email and password, and returns user data upon successful login.
 * @param data User login credentials
 * @returns 
 */
export async function loginUser(data: LoginRequest): Promise<AuthUser> {
  const res = await request<AuthUser>(`${BASE_URL}/users/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * This function logs out the current user from the system.
 * It clears the user's session and returns a success message.
 * @returns 
 */
export async function logoutUser(): Promise<void> {
    await request<void>(`${BASE_URL}/users/logout`, {
      method: 'POST',
    });
  }
  
/**
 * This function sends a verification email to the user.
 * It is typically used during the registration process
 * to verify the user's email address.
 * @param email The email address to send the verification to
 * @returns 
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  await request<void>(`${BASE_URL}/users/email-verification/send`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
