// /utils/validators.ts
import { CreateProductRequest } from "../models/products";
import { CreatePostRequest } from "../models/post";
import { CreateRequestPayload } from "../models/request";

export function validateProduct(payload: CreateProductRequest) {
  const errors: string[] = [];
  if (!payload.name || payload.name.trim().length === 0) errors.push("Product name is required.");
  if (typeof payload.price !== "number" || Number.isNaN(payload.price)) errors.push("Valid product price is required.");
  if ((payload.media_ids ?? []).length === 0) errors.push("At least one media_id is recommended.");
  return errors;
}

export function validatePost(payload: CreatePostRequest) {
  const errors: string[] = [];
  if (!payload.caption && (!payload.media_ids || payload.media_ids.length === 0)) errors.push("Post must have caption or media.");
  if ((payload.caption ?? "").length > 2000) errors.push("Caption too long.");
  return errors;
}

export function validateRequest(payload: CreateRequestPayload) {
  const errors: string[] = [];
  if (!payload.title || payload.title.trim().length === 0) errors.push("Title is required.");
  if (!payload.description || payload.description.trim().length === 0) errors.push("Description is required.");
  return errors;
}
