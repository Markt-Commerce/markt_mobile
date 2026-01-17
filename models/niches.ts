import { Post } from "./feed";

export interface NichesResponse {
  items: Niches[];
  pagination: Pagination;
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

  status: "active" | "inactive" | string;
  visibility: "public" | "private" | string;

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

  visibility: "public" | "private";

  max_members: number;

  allow_buyer_posts: boolean;
  allow_seller_posts: boolean;
  require_approval: boolean;

  tags: string[];
  category_ids: number[];
  rules: string[];

  settings: CommunitySettings;
}

