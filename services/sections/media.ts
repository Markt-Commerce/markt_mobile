import { BASE_URL,request } from "../api";
import { ProductImageResponse,SocialPostMediaResponse, RequestImageResponse } from "../../models/media";


/**
 * Uploads images for a given product.
 * @param productId The ID of the product to upload images for.
 * @param formData The FormData object containing the image file(s).
 * @returns ProductImageResponse object
 */
export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ProductImageResponse> {
  const res = await request<ProductImageResponse>(`${BASE_URL}/api/v1/media/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });
  return res;
}

/**
 * Uploads media for a social post.
 * @param postId The ID of the social post to upload media for.
 * @param formData The FormData object containing the media file(s).
 * @returns SocialPostMediaResponse object
 */
export async function uploadSocialPostMedia(
  postId: string,
  formData: FormData
): Promise<SocialPostMediaResponse> {
  const res = await request<SocialPostMediaResponse>(`${BASE_URL}/api/v1/media/social-posts/${postId}/media`, {
    method: 'POST',
    body: formData,
  });
  return res;
}

/**
 * Uploads images for a request.
 * @param requestId The ID of the request to upload images for.
 * @param formData The FormData object containing the image file(s).
 * @returns RequestImageResponse object
 */
export async function uploadRequestImage(
  requestId: string,
  formData: FormData
): Promise<RequestImageResponse> {
  const res = await request<RequestImageResponse>(`${BASE_URL}/api/v1/media/request/${requestId}/images`, {
    method: 'POST',
    body: formData,
  });
  return res;
}