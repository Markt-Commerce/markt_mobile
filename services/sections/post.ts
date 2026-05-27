// /services/postService.ts
import { request, BASE_URL } from "../api";
import { CommentCreatedResponse, CommentResponse, CreatePostRequest, PostDetails, PostResponse } from "../../models/post";
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

export async function likePost(postId:string) {
  const res = await request<ApiResponse<PostResponse>>(`${BASE_URL}/socials/posts/${postId}/like`, {
    method: "POST"
  });
  return (res as any).data ?? (res as any);
}

export async function getPostById(postId:string):Promise<PostDetails>{
  const res = await request<ApiResponse<PostDetails>>(`${BASE_URL}/socials/posts/${postId}`, {
    method: "GET"
  });
  return (res as any).data ?? (res as any);
}

export async function getPostComments(postId:string, page: number):Promise<CommentResponse> {
  const res = await request<ApiResponse<CommentResponse>>(`${BASE_URL}/socials/posts/${postId}/comments`, {
    method: "GET"
  });
  return (res as any).data ?? (res as any);
}

export async function commentOnPost(postId:string, comment: string, parentId?: number) : Promise<CommentCreatedResponse> {
  const payload: { content: string; parent_id?: number } = {
    content:comment,
  };
  if (parentId) payload.parent_id = parentId;
  const res = await request<ApiResponse<CommentCreatedResponse>>(`${BASE_URL}/socials/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (res as any).data ?? (res as any);
}