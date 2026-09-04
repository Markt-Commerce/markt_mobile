# Mobile Home Feed — API Contracts

This document defines the **exact API contracts** for the Expo/React Native home screen: feed endpoints (For You, Discover, Following, Trending, Niche) and global search. Use these for TypeScript types, mocks, and integration.

**Base URL:** All endpoints are under `{API_BASE}/api/v1` (e.g. `https://your-api.com/api/v1`).

**Auth:** Feed and discover/trending/following require **logged-in user** (session cookie or `Authorization: Bearer <token>` as per your backend). Global search works **with or without** auth; results may vary by auth.

---

## 1. Feed endpoints (use these instead of separate product/post lists)

All feed endpoints return a **single hybrid list** of mixed **posts** and **products** with pagination. One request per tab — no need to call `/products` and `/posts` separately.

### 1.1 Shared query parameters (all feed endpoints)

| Parameter       | Type    | Default   | Description |
|----------------|---------|-----------|-------------|
| `page`         | integer | `1`       | Page number (1-based). |
| `per_page`     | integer | `20`      | Items per page (e.g. 10–20). |
| `force_refresh`| boolean | `false`   | **Main feed only.** Skip cache and regenerate feed. |

### 1.2 Main feed — “For You” (personalized)

- **URL:** `GET /api/v1/socials/feed`
- **Auth:** Required.
- **Query:** `page`, `per_page`, `force_refresh` (optional).

**Response (200):**

```json
{
  "items": [
    {
      "id": "PST_xxx",
      "type": "post",
      "caption": "string or null",
      "user": {
        "id": "user-uuid",
        "username": "string",
        "profile_picture": "url or null"
      },
      "media": [
        {
          "url": "https://...",
          "type": "image",
          "platform": "instagram",
          "post_type": "post",
          "aspect_ratio": "1:1",
          "optimized_for_platform": true
        }
      ],
      "likes_count": 0,
      "comments_count": 0,
      "created_at": "2025-02-15T12:00:00",
      "score": 0.5,
      "niche": {
        "id": "niche-uuid",
        "name": "string",
        "slug": "string",
        "visibility": "public",
        "is_pinned": false,
        "is_featured": false,
        "niche_likes": 0,
        "niche_comments": 0
      }
    },
    {
      "id": "PRD_xxx",
      "type": "product",
      "name": "string",
      "description": "string or null",
      "price": 99.99,
      "seller": {
        "id": 1,
        "shop_name": "string",
        "user": {
          "id": "user-uuid",
          "username": "string",
          "profile_picture": "url or null"
        }
      },
      "images": [
        {
          "url": "https://...",
          "type": "image",
          "sort_order": 0,
          "is_featured": true,
          "alt_text": "string or null"
        }
      ],
      "rating": 4.5,
      "reviews_count": 10,
      "created_at": "2025-02-15T12:00:00",
      "score": 0.3
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Notes:**

- Each item has `type`: `"post"` or `"product"`. Use this to render the correct card.
- Post IDs start with `PST_`, product IDs with `PRD_`.
- `niche` on posts may be `null` if the post is not in a niche.
- `media` / `images` arrays may be empty; handle missing media in the UI.

---

### 1.3 Discover feed

- **URL:** `GET /api/v1/socials/feed/discover`
- **Auth:** Required.
- **Query:** `page`, `per_page` (same as above).

**Response:** Same shape as **1.2** (items + pagination). Content is tuned for discovery (e.g. new creators, categories).

---

### 1.4 Trending feed

- **URL:** `GET /api/v1/socials/feed/trending`
- **Auth:** Required.
- **Query:** `page`, `per_page`.

**Response:** Same shape as **1.2**. Content is trending/popular.

---

### 1.5 Following feed

- **URL:** `GET /api/v1/socials/feed/following`
- **Auth:** Required.
- **Query:** `page`, `per_page`.

**Response:** Same shape as **1.2**. Content from sellers/users the current user follows.

---

### 1.6 Niche feed (single community)

- **URL:** `GET /api/v1/socials/feed/niche/{niche_id}`
- **Auth:** Required.
- **Path:** `niche_id` — UUID of the niche.
- **Query:** `page`, `per_page`.

**Response:** Same shape as **1.2**. Content limited to that niche.

---

### 1.7 Tab → endpoint mapping (summary)

| Tab / Section   | Endpoint |
|-----------------|----------|
| For You         | `GET /api/v1/socials/feed?page=1&per_page=20` |
| Discover        | `GET /api/v1/socials/feed/discover?page=1&per_page=20` |
| Trending        | `GET /api/v1/socials/feed/trending?page=1&per_page=20` |
| Following       | `GET /api/v1/socials/feed/following?page=1&per_page=20` |
| Niche (e.g. “Tech”) | `GET /api/v1/socials/feed/niche/{niche_id}?page=1&per_page=20` |

---

## 2. Global search

Single endpoint that returns **products**, **posts**, and **sellers** in one response. Use this for the app’s global search (e.g. header or search screen).

- **URL:** `GET /api/v1/search/`
- **Auth:** Optional (results can differ when logged in).
- **Query:**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `search` | string | Yes*     | Search term. If empty/absent, backend returns empty lists. |
| `page`   | integer| No       | Default `1`. |
| `per_page` | integer | No    | Default `20`. |

**Response (200):**

```json
{
  "page": 1,
  "per_page": 20,
  "products": [
    {
      "id": "PRD_xxx",
      "name": "string",
      "description": "string",
      "price": 99.99,
      "seller_id": 1,
      "created_at": "2025-02-15T12:00:00",
      "updated_at": "2025-02-15T12:00:00",
      "view_count": 0,
      "average_rating": 4.5,
      "review_count": 10,
      "categories": [],
      "images": [{ "url": "...", "type": "image", "sort_order": 0, "is_featured": true, "alt_text": null }],
      "seller": {
        "id": 1,
        "shop_name": "string",
        "shop_slug": "string",
        "verification_status": "verified",
        "average_rating": 4.5,
        "total_products": 5,
        "profile_picture_url": "url"
      }
    }
  ],
  "posts": [
    {
      "id": "PST_xxx",
      "user_id": "user-uuid",
      "caption": "string",
      "created_at": "2025-02-15T12:00:00",
      "like_count": 0,
      "comment_count": 0,
      "status": "active",
      "categories": [],
      "social_media": [{ "id": 1, "post_id": "PST_xxx", "media_id": 1, "platform": "instagram", "post_type": "post", "media": { "original_url": "...", "thumbnail_url": "..." } }],
      "products": [],
      "user": { "id": "user-uuid", "username": "string", "profile_picture": "url" }
    }
  ],
  "sellers": [
    {
      "id": 1,
      "shop_name": "string",
      "shop_slug": "string",
      "verification_status": "verified",
      "average_rating": 4.5,
      "total_products": 5,
      "profile_picture_url": "url"
    }
  ]
}
```

**Notes:**

- With no `search` term, the API returns `products: []`, `posts: []`, `sellers: []` with the requested `page` and `per_page`.
- Products and posts use the same ID prefixes (`PRD_`, `PST_`) as the feed for deep linking.

---

## 3. Pagination (backend behavior)

- **Cursor vs offset:** The backend uses **offset-based** pagination: `page` and `per_page`.
- **Metadata:** Feed responses include `pagination.has_next` and `pagination.has_prev`; use these to show “Load more” or disable next/prev.
- **Consistency:** Within a tab, keep `per_page` fixed (e.g. 20) and increment `page` for the next load.

---

## 4. Errors (typical)

- **401 Unauthorized:** Feed endpoints require login; redirect to login or show “Sign in to see your feed”.
- **500 Server Error:** Feed may return fallback (e.g. empty or trending); document behavior in your error handler.
- **Rate limiting:** If the backend adds rate limits, responses will use standard HTTP status (e.g. 429) and possibly a `Retry-After` header.

Use these contracts to define TypeScript interfaces and to implement the home screen using **only the feed and search endpoints** above, without calling product and post list endpoints separately for the main feed.
