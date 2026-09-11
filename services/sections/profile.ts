import { BASE_URL, request } from '../api';
import { appendLocalFile } from '../../utils/formDataFile';
import { prepareImageForUpload } from '../../utils/imagePrep';
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

/**
 * Uploads a shop's cover image (POST /api/v1/users/profile/seller/banner).
 *
 * Separate from the profile picture because they are different images in
 * different places: the picture is the shop's avatar, the banner is the wide
 * image behind it on a shop card. Replacing one deletes the file it replaced,
 * so re-uploading does not leak.
 */
export async function uploadShopBanner(
  uri: string,
  fileName = 'banner.jpg'
): Promise<{ urls?: { original?: string } }> {
  const form = new FormData();
  // Downscale/re-encode first, then append as a File (Blob) — classic
  // `{uri, name, type}` parts throw "Unsupported FormDataPart implementation"
  // under Expo's fetch. Same shape as uploadProfilePicture.
  const prepped = await prepareImageForUpload({ uri });
  appendLocalFile(
    form,
    'file',
    prepped.uri,
    prepped.uri === uri ? fileName : undefined
  );

  return request(`${BASE_URL}/users/profile/seller/banner`, {
    method: 'POST',
    body: form,
  });
}
