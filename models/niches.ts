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

  /** Community imagery. Added in markt_python feat/niche-media-and-filters —
   *  before that a niche had no avatar at all and every card rendered as an
   *  initial on a coloured square. */
  image_url?: string | null;
  banner_url?: string | null;
  /** Resolved for the requesting user in one batched query, so a list can show
   *  Join vs Joined without a call per card. */
  is_member?: boolean;

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
  /** Ordering was hardcoded server-side, so the biggest communities were the
   *  only ones anyone saw. */
  sort?: "trending" | "newest" | "members" | "name";
  /** Serves the "your communities" and "discover" tabs off one endpoint. */
  membership?: "joined" | "not_joined";
  page?: number;
  per_page?: number;
}

