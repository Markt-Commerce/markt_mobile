import { BASE_URL,request } from "../api";
import { ProductImageResponse,SocialPostMediaResponse, RequestImageResponse, MediaResponse } from "../../models/media";
import { InstagramGridProps } from '../../components/imagePicker'
import { Media } from "../../models/feed";

/** 
 * Uploads an image
 * @param formData The FormData object containing the image file(s).
 * @returns Uploaded image response
 */
export async function uploadImage(
  formData: FormData
) : Promise<MediaResponse>{
  const res = await request<MediaResponse>(`${BASE_URL}/media/upload`, {
    method: 'POST',
    body: formData,
  });
  return res;
}

/**
 * Attempts to upload multiple images using a promise list
 * @param formList
 * @returns promise of the data sent 
 */
export async function attemptMultipleUpload(
  formList: InstagramGridProps['value']
): Promise<MediaResponse[]>{
  const ImageResponse = await Promise.all(
      formList?.map(
      async (img)=>{
        const formData = new FormData();
        //attempt to determine the type of the image
        let mimeType: string | undefined = (img as any).type;

        // If type not provided try to infer from the uri or filename
        if (!mimeType) {
          const uri = img.uri || '';
          // data URI (data:<mime>;base64,...)
          if (uri.startsWith('data:')) {
            const m = uri.match(/^data:([^;]+);/);
            mimeType = m ? m[1] : undefined;
          } else {
            // try extension from uri or filename
            const extMatch = uri.match(/\.([^.?#]+)(?:[?#]|$)/i) ||
                 (img.fileName ? img.fileName.match(/\.([^.?#]+)(?:[?#]|$)/i) : null);
            const ext = extMatch ? extMatch[1].toLowerCase() : undefined;

            const extToMime: Record<string, string> = {
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
              heic: 'image/heic',
              heif: 'image/heif',
              svg: 'image/svg+xml',
              mp4: 'video/mp4',
              mov: 'video/quicktime',
              mkv: 'video/x-matroska',
              avi: 'video/x-msvideo'
            };

            if (ext && extToMime[ext]) {
              mimeType = extToMime[ext];
            }
          }
        }

        // fallback to a safe default
        if (!mimeType) {
          mimeType = 'image/jpeg';
        }

        // ensure a filename exists; if not, derive from mime type
        const name = img.fileName ?? `upload.${mimeType.split('/')[1] || 'jpg'}`;

        const requestBody = { uri: img.uri, name, type: mimeType };
        console.log(requestBody);
        formData.append('file', requestBody as any);
        const result = await uploadImage(formData);
        console.log(formData.getAll('file'));
        return result
      }) as Promise<MediaResponse>[]
    );
    return ImageResponse;
}


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
  const res = await request<ProductImageResponse>(`${BASE_URL}/media/products/${productId}/images`, {
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
  const res = await request<SocialPostMediaResponse>(`${BASE_URL}/media/social-posts/${postId}/media`, {
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
  const res = await request<RequestImageResponse>(`${BASE_URL}/media/request/${requestId}/images`, {
    method: 'POST',
    body: formData,
  });
  return res;
}