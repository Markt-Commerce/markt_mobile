import { BASE_URL, request } from '../api';
import {
  UserAddress,
  UserProfile,
  UpdateProfileRequest,
  UpdateBuyerProfileRequest,
  UpdateSellerProfileRequest
} from '../../models/profile';

/**
 * Fetches the authenticated user's profile.
 * Includes buyer and seller account details if applicable.
 * @returns User profile data
 */
export async function getUserProfile(): Promise<UserProfile> {
  const res = await request<UserProfile>(`${BASE_URL}/users/profile`, {
    method: 'GET',
  });
  return res;
}

/**
 * Updates the user's general profile information such as phone number and profile picture.
 * @param data The data to update (phone_number, profile_picture)
 * @returns Updated user profile
 */
export async function updateUserProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const res = await request<UserProfile>(`${BASE_URL}/users/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Updates buyer-specific information like buyer name and shipping address.
 * @param data The buyer profile update data
 * @returns Updated user profile
 */
export async function updateBuyerProfile(data: UpdateBuyerProfileRequest): Promise<UserProfile> {
  const res = await request<UserProfile>(`${BASE_URL}/users/profile/buyer`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Updates seller-specific information such as shop name, description, policies, and categories.
 * @param data The seller profile update data
 * @returns Updated user profile
 */
export async function updateSellerProfile(data: UpdateSellerProfileRequest): Promise<UserProfile> {
  const res = await request<UserProfile>(`${BASE_URL}/users/profile/seller`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Sets the user's address (PATCH /api/v1/users/address).
 *
 * This is the delivery/pickup address on the account. It is not the browse
 * location — that is a separate concept with its own storage, because where
 * you shop from and where you want things sent are different questions.
 */
export async function updateUserAddress(data: UserAddress): Promise<UserAddress> {
  const res = await request<UserAddress>(`${BASE_URL}/users/address`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}
