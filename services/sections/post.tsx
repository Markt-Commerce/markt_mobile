// /services/postService.ts
import { request, BASE_URL } from "../api";
import { CreatePostRequest, PostResponse } from "../../models/post";
import { ApiResponse } from "../../models/auth";

/**
 * Create a social post
 */
export async function createPost(payload: CreatePostRequest): Promise<PostResponse> {
  const res = await request<ApiResponse<PostResponse>>(`${BASE_URL}/socials/posts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (res as any).data ?? (res as any);
}
