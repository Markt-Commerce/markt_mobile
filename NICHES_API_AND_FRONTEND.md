# Niches (Communities) — API Contract & Frontend Instructions

This document provides the **API contract** for niche communities (topic-based groups for posts and products) and **frontend implementation instructions** for React Native / web.

**Base URL:** `{API_BASE}/api/v1`. **Auth:** Session cookie. Many read endpoints work without auth; write and membership require login. `niche_id` is a string (e.g. `NCH_abc123`).

---

## Part 1: API Contract

### 1.1 Overview

**Niches** are topic-based communities. Users can browse, join, and post to niches. Visibility controls who can see and join:
- **public** — Anyone can see and join.
- **private** — Only members see content; join by invite.
- **restricted** — Visible but join may require approval.

**Member roles:** `member`, `moderator`, `admin`, `owner`. Owners/moderators can approve posts (if `require_approval`) and moderate members.

---

### 1.2 List / Search niches (Discover)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches` | GET | Optional | Search and list niche communities |

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Search in name and description |
| `category_ids` | int[] | — | Filter by category IDs |
| `visibility` | string | — | `public`, `private`, `restricted` |
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (1–100) |

**Response (200):**

```json
{
  "items": [
    {
      "id": "NCH_abc123",
      "name": "Tech Deals",
      "description": "Best tech deals and gadgets",
      "slug": "tech-deals",
      "status": "active",
      "visibility": "public",
      "allow_buyer_posts": true,
      "allow_seller_posts": true,
      "require_approval": false,
      "max_members": 10000,
      "categories": [{ "id": 1, "name": "Electronics", "slug": "electronics" }],
      "tags": ["tech", "gadgets"],
      "rules": [],
      "member_count": 123,
      "post_count": 456,
      "created_at": "2025-01-01T00:00:00",
      "updated_at": "2025-02-15T00:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 42,
    "total_pages": 3
  }
}
```

**Visibility filtering:** Anonymous users see only `public` niches. Logged-in users see `public` and `restricted`.

---

### 1.3 Get niche detail

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>` | GET | Optional | Get niche details (access depends on visibility) |

**Response (200):** Full NicheSchema (same shape as list item). 404 if not found or no access.

---

### 1.4 Create niche (Sellers only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches` | POST | Required (seller) | Create a new niche community |

**Body (JSON):**

```json
{
  "name": "Tech Deals",
  "description": "Best tech deals and gadgets. At least 10 characters.",
  "visibility": "public",
  "allow_buyer_posts": true,
  "allow_seller_posts": true,
  "require_approval": false,
  "max_members": 10000,
  "category_ids": [1, 2],
  "tags": ["tech", "gadgets"],
  "rules": [],
  "settings": {}
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | yes | — | 1–100 chars |
| `description` | string | yes | — | 10–2000 chars |
| `visibility` | string | no | `public` | `public`, `private`, `restricted` |
| `allow_buyer_posts` | bool | no | true | Allow buyers to post |
| `allow_seller_posts` | bool | no | true | Allow sellers to post |
| `require_approval` | bool | no | false | Posts need moderator approval |
| `max_members` | int | no | 10000 | Max members (1–100000) |
| `category_ids` | int[] | no | [] | Category IDs |
| `tags` | string[] | no | [] | Tags |
| `rules` | string[] | no | [] | Community rules |
| `settings` | object | no | {} | Additional settings |

**Response (201):** Created niche (NicheSchema). Creator is owner.

**Errors:** 400 validation, 403 not a seller.

---

### 1.5 Update niche (Owner only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>` | PUT | Required | Update niche (owner only) |

**Body:** Same fields as create; all optional (partial update).

**Response (200):** Updated niche.

**Errors:** 403 not owner.

---

### 1.6 Join niche

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/join` | POST | Required | Join a niche community |

**Response (200):** NicheMembershipSchema (id, niche_id, user_id, role, joined_at, niche nested, etc.).

**Errors:** 403 if private and no invite; 409 if already a member.

---

### 1.7 Leave niche

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/leave` | POST | Required | Leave a niche |

**Response (200):** Empty or confirmation.

**Errors:** 403 if owner (may require transfer first).

---

### 1.8 My niches (User's memberships)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/my-niches` | GET | Required | Get current user's niche memberships |

**Query:** `page`, `per_page`.

**Response (200):**

```json
{
  "items": [
    {
      "id": 12,
      "niche_id": "NCH_abc123",
      "user_id": "USR_xxx",
      "role": "member",
      "joined_at": "2025-02-01T00:00:00",
      "is_active": true,
      "niche": {
        "id": "NCH_abc123",
        "name": "Tech Deals",
        "slug": "tech-deals",
        "visibility": "public",
        "member_count": 123,
        "post_count": 456
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 3,
    "total_pages": 1
  }
}
```

**Frontend use:** Use `items[].niche` for chips in the feed tab row (see FEED_TABS_AND_NICHES.md).

---

### 1.9 Niche members

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/members` | GET | Required | Get niche members (filter by role) |

**Query:** `page`, `per_page`, optional `role` filter.

**Response (200):** NicheMembershipSearchResultSchema (items with user, role, joined_at, etc.).

---

### 1.10 Can post in niche

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/can-post` | GET | Required | Check if user can post in niche |

**Response (200):**

```json
{
  "can_post": true
}
```

**OR when false:**

```json
{
  "can_post": false,
  "reason": "You must be a member to post"
}
```

**Reasons:** `"Community not found"`, `"You must be a member to post"`, `"You are banned"`, etc.

---

### 1.11 Niche feed

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/feed/niche/<niche_id>` | GET | Required | Get feed for a specific niche |

**Query:** `page`, `per_page` (same as other feed endpoints).

**Response (200):** Same hybrid feed shape as For You / Discover (items + pagination). Contains posts and products from that niche.

---

### 1.12 Niche posts (list)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/posts` | GET | Optional | Get posts from a niche |

**Query:** `page`, `per_page`.

**Response (200):** NichePostListSchema (posts with niche context).

---

### 1.13 Create post in niche

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/posts` | POST | Required | Create a post in the niche |

**Body:** Same as regular post creation (caption, social_media, products, status). User must be a member and pass `can-post` check. If `require_approval` is true, post may be pending until approved.

**Response (201):** NichePostResponseSchema (post + niche_post).

**Errors:** 403 if not member or banned, or `can_post` is false.

---

### 1.14 Approve / Reject post (Moderators only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/posts/<post_id>/approve` | POST | Required (moderator) | Approve or reject a pending post |

**Body:**

```json
{
  "action": "approve"
}
```

**OR for reject:**

```json
{
  "action": "reject",
  "reason": "Does not fit community guidelines"
}
```

**Response (200):** Updated niche post.

---

### 1.15 Moderate user (Moderators only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/socials/niches/<niche_id>/moderate` | POST | Required (moderator) | Ban, warn, or remove post for a user |

**Body:**

```json
{
  "target_user_id": "USR_xxx",
  "action_type": "ban",
  "reason": "Spam",
  "duration": null,
  "target_type": "user",
  "target_id": "USR_xxx",
  "banned_until": "2025-03-15T00:00:00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_user_id` | string | yes | User to moderate |
| `action_type` | string | yes | `ban`, `warn`, `remove_post` |
| `reason` | string | yes | 1–500 chars |
| `duration` | duration | no | Ban duration |
| `target_type` | string | no | `user`, `post`, `comment` |
| `target_id` | string | no | Target ID |
| `banned_until` | datetime | no | When ban ends |

**Response (200):** NicheModerationActionSchema.

---

## Part 2: Frontend Instructions

### 2.1 Feed tab row (same line as main tabs)

Use a **single horizontal scrollable row** for feed navigation, including niches:

**Order:** `For You` | `Discover` | `Trending` | `Following` | `[Niche A]` | `[Niche B]` | … | `+ Explore`

- **Main tabs:** Drive feed via existing endpoints.
- **Niche chips:** Use `items[].niche` from `GET /socials/my-niches`. Label = `niche.name`, value = `niche.id`.
- **Niche feed:** `GET /socials/feed/niche/<niche_id>` when a niche chip is selected.
- **+ Explore:** Navigate to discover-communities screen.

See FEED_TABS_AND_NICHES.md for full layout.

---

### 2.2 Discover communities screen

- **API:** `GET /socials/niches?search=&page=1&per_page=20`
- **UI:** Search bar (debounced), optional category filter, list/grid of niche cards.
- **Card:** Name, description, member_count, post_count, visibility badge.
- **Tap:** Open niche detail.
- **Join:** `POST /socials/niches/<niche_id>/join`; on success, refresh my-niches and optionally add chip to tab row.

---

### 2.3 Niche detail screen

- **API:** `GET /socials/niches/<niche_id>`
- **Content:** Header (name, description, member_count, post_count), rules, categories.
- **Actions:** Join / Leave button (based on membership). Before posting, call `GET /socials/niches/<niche_id>/can-post` to decide if "Create post" is enabled.
- **Feed:** Either embed feed or link to feed with niche selected (same endpoint as niche tab).

---

### 2.4 Create niche (Sellers only)

- **Form:** Name, description (min 10 chars), visibility, allow_buyer_posts, allow_seller_posts, require_approval, categories, tags, rules.
- **Submit:** `POST /socials/niches`
- **Gate:** Only show "Create niche" for sellers (`current_role === "seller"`).

---

### 2.5 Posting in a niche

1. User taps "Create post" on niche detail or feed.
2. Call `GET /socials/niches/<niche_id>/can-post`. If `can_post: false`, show `reason` and disable post button.
3. Use existing post creation flow; `POST /socials/niches/<niche_id>/posts` with post payload.
4. If `require_approval`, show "Pending approval" state; moderators use approve/reject endpoint.

---

### 2.6 Moderation (Moderators / Admins)

- **Pending posts:** List posts with `is_approved: false`; show approve/reject actions.
- **Member management:** List members; moderate (ban/warn) via `POST /socials/niches/<niche_id>/moderate`.

---

### 2.7 TypeScript types (summary)

```ts
type NicheVisibility = "public" | "private" | "restricted";
type NicheStatus = "active" | "inactive" | "moderated" | "archived";
type NicheMemberRole = "member" | "moderator" | "admin" | "owner";

interface Niche {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: NicheStatus;
  visibility: NicheVisibility;
  allow_buyer_posts: boolean;
  allow_seller_posts: boolean;
  require_approval: boolean;
  max_members: number;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: string[];
  rules: string[];
  member_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

interface NicheMembership {
  id: number;
  niche_id: string;
  user_id: string;
  role: NicheMemberRole;
  joined_at: string;
  is_active: boolean;
  niche: Niche;
}
```

---

## Part 3: Quick reference

| Action | Method | Path |
|--------|--------|------|
| List/search niches | GET | `/socials/niches` |
| Get niche | GET | `/socials/niches/<niche_id>` |
| Create niche | POST | `/socials/niches` (seller) |
| Update niche | PUT | `/socials/niches/<niche_id>` (owner) |
| Join niche | POST | `/socials/niches/<niche_id>/join` |
| Leave niche | POST | `/socials/niches/<niche_id>/leave` |
| My niches | GET | `/socials/my-niches` |
| Niche members | GET | `/socials/niches/<niche_id>/members` |
| Can post | GET | `/socials/niches/<niche_id>/can-post` |
| Niche feed | GET | `/socials/feed/niche/<niche_id>` |
| Niche posts | GET | `/socials/niches/<niche_id>/posts` |
| Create post in niche | POST | `/socials/niches/<niche_id>/posts` |
| Approve/reject post | POST | `/socials/niches/<niche_id>/posts/<post_id>/approve` (moderator) |
| Moderate user | POST | `/socials/niches/<niche_id>/moderate` (moderator) |
