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


/** * This function verifies the email using a code sent to the user's email address.
 * It is used to confirm that the user has access to the provided email.
 * @param email The email address to verify
 * @param code The verification code sent to the email
 * @returns 
 */
export async function verifyEmail(email: string, code: string): Promise<string> {
  const res = await request<{message: string}>(`${BASE_URL}/users/email-verification/verify`, {
    method: 'POST',
    body: JSON.stringify({ email, verification_code:code }),
  });
  return res.message;
}

/**
 *  This function sends a password reset email to the user.
 *  It is used when a user forgets their password and needs to reset it.
 * @param email The email address to send the password reset link to
 * @returns 
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  await request<void>(`${BASE_URL}/users/password-reset`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * This function resets the user's password using a verification code.
 * It is used after the user has requested a password reset and received a code via email.
 * @param email The email address associated with the account
 * @param code The verification code sent to the email
 * @param newPassword The new password to set for the account
 * @param confirmNewPassword The confirmation of the new password
 * @returns 
 */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<string> {
  const res = await request<{message: string}>(`${BASE_URL}/users/password-reset/confirm`, {
    method: 'POST',
    body: JSON.stringify({ email, code:code, new_password: newPassword }),
  });
  return res.message;
}