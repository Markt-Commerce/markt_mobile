import { BASE_URL,request } from "../api";
import { ProductImageResponse,SocialPostMediaResponse, RequestImageResponse, MediaResponse } from "../../models/media";
import { InstagramGridProps } from '../../components/imagePicker'
import { Media } from "../../models/feed";
import { Buffer } from 'buffer';

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

        // Read the file as an ArrayBuffer/Blob and append that to FormData
        const uri = img.uri || '';
        let fileBlob: Blob | undefined;

        try {
          // Try to fetch the resource and convert to a Blob.
          // This works for data: URIs, http(s) and many file URIs depending on environment.
          console.log('fetching uri:', uri);
          const response = await fetch(uri);
          const arrayBuffer = await response.arrayBuffer();
          //convert to base64
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          fileBlob = new Blob([base64], { type: mimeType });
        } catch (fetchErr) {
          console.warn('Failed to fetch uri as blob:', uri, fetchErr);
          // Fallback: if the image provides a base64 property, convert that to a Blob.
          const b64 = (img as any).base64;
          if (b64) {
            // Remove possible data url prefix if present
            const cleaned = b64.replace(/^data:.*;base64,/, '');
            // atob may not exist in some environments; prefer global atob if present, otherwise use Buffer
            let binaryString: string;
            if (typeof atob === 'function') {
              binaryString = atob(cleaned);
            } else if (typeof Buffer !== 'undefined') {
              binaryString = Buffer.from(cleaned, 'base64').toString('binary');
            } else {
              throw fetchErr; // rethrow original fetch error if no decoder available
            }

            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            fileBlob = new Blob([bytes], { type: mimeType });

            console.log('created blob from base64, size:', fileBlob.size);
          } else {
            // If all else fails create an empty blob so the request won't crash (or rethrow if preferred)
            fileBlob = new Blob([], { type: mimeType });
          }
        }

        // Append the blob with filename to FormData
        // In browsers FormData.append accepts (name, blob, filename)
        // In some React Native environments this also works; if your RN environment expects { uri, name, type } revert accordingly.
        formData.append('file', fileBlob, name);
        // optional debug
        console.log('appending file:', name, mimeType, 'size:', fileBlob.size);
        console.log(formData.getAll('file'));
        try {
          const result = await uploadImage(formData);
          return result;
        } catch (error) {
          console.error("Upload failed:", error);
        }
        //return result
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