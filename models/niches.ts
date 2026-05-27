import { Post } from "./feed";

export type NicheVisibility = "public" | "private" | "restricted";
export type NicheStatus = "active" | "inactive" | "moderated" | "archived";
export type NicheMemberRole = "member" | "moderator" | "admin" | "owner";

export interface NichesResponse {
  items: Niches[];
  pagination: Pagination;
}

/** My-niches returns memberships with nested niche (NICHES_API §1.8) */
export interface MyNichesResponse {
  items: NicheMembership[];
  pagination: Pagination;
}

export interface NicheMembership {
  id: number;
  niche_id: string;
  user_id: string;
  role: NicheMemberRole;
  joined_at: string;
  is_active: boolean;
  niche: Niches;
}

export interface NicheCanPostResponse {
  can_post: boolean;
  reason?: string;
}

export interface NichePost {
  id: number;
  post_id: string;
  niche_id: string;
  post: Post;
  niche: Niches;
  is_pinned: boolean;
  is_featured: boolean;
  is_approved: boolean;
  status: string;
  niche_likes: number;
  niche_comments: number;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NichePostsResponse {
  items: NichePost[];
  pagination: Pagination;
}

export interface Niches {
  id: string;
  name: string;
  slug: string;
  description: string;
  status?: NicheStatus | string;
  visibility?: NicheVisibility | string;

  allow_buyer_posts: boolean;
  allow_seller_posts: boolean;
  require_approval: boolean;

  max_members: number;
  member_count: number;
  post_count: number;

  categories: Category[];
  tags: string[];
  rules: string[];

  settings: CommunitySettings;

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  parent_id: number | null;
}

export interface CommunitySettings {

}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface CreateNicheRequest {
  name: string;
  description: string;
  visibility?: NicheVisibility | string;
  max_members?: number;
  allow_buyer_posts?: boolean;
  allow_seller_posts?: boolean;
  require_approval?: boolean;
  category_ids?: number[];
  tags?: string[];
  rules?: string[];
  settings?: CommunitySettings;
}

export interface NichesListParams {
  search?: string;
  category_ids?: number[];
  visibility?: NicheVisibility | string;
  page?: number;
  per_page?: number;
}

