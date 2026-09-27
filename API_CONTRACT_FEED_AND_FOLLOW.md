# API Contract: Feed Indicators & Follow/Unfollow (Frontend)

This document is the **API contract for the frontend team** for:

1. **Feed response fields:** `liked_by_me` (posts) and `follower_count` / `is_followed` (seller on product items).
2. **Follow / Unfollow** a user (e.g. seller): endpoints, request/response, and how to use `seller.user.id`.

**Base URL:** `{API_BASE}/api/v1` (e.g. `http://localhost:8000/api/v1`).  
**Auth:** All endpoints below require an authenticated user (session cookie). Send cookies with every request.

---

## 1. Feed endpoints and new/updated fields

Use these for **For You**, **Discover**, **Trending**, **Following**, and **Niche** feeds. All return the same response shape.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/socials/feed` | GET | For You (personalized) |
| `/socials/feed/discover` | GET | Discover |
| `/socials/feed/trending` | GET | Trending |
| `/socials/feed/following` | GET | Following |
| `/socials/feed/niche/<niche_id>` | GET | Niche feed |

**Query (all):** `page` (default 1), `per_page` (default 20). For For You only: `force_refresh` (boolean, optional).

**Response (200):**

```json
{
  "items": [
    { "post item" },
    { "product item" }
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

---

### 1.1 Post item (feed)

Every **post** in `items` has `type: "post"` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Post id (e.g. `PST_xxx`) |
| `type` | string | `"post"` |
| `caption` | string \| null | Post caption |
| `user` | object | `{ id, username, profile_picture }` |
| `media` | array | List of media objects |
| `likes_count` | number | Total like count |
| `comments_count` | number | Total comment count |
| **`liked_by_me`** | **boolean** | **`true` if the current user has liked this post; otherwise `false`. Use for filled vs outline heart.** |
| `created_at` | string | ISO 8601 datetime |
| `score` | number | Relevance score (optional for UI) |
| `niche` | object \| null | Niche info when post is in a niche |

**Frontend usage:** Use `liked_by_me` to show the correct like state (e.g. filled heart) without an extra request. After the user toggles like via `POST /socials/posts/<post_id>/like`, update local state or refetch the feed.

---

### 1.2 Product item (feed)

Every **product** in `items` has `type: "product"` and includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Product id (e.g. `PRD_xxx`) |
| `type` | string | `"product"` |
| `name` | string | Product name |
| `description` | string \| null | Description |
| `price` | number | Price |
| `seller` | object | Seller (see below) |
| `images` | array | Product images |
| `rating` | number \| null | Average rating |
| `reviews_count` | number | Number of reviews |
| `created_at` | string | ISO 8601 datetime |
| `score` | number | Relevance score (optional for UI) |

**Seller object (on product):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Seller/shop id |
| `shop_name` | string | Shop name |
| **`follower_count`** | **number** | **Number of followers of this seller.** |
| **`is_followed`** | **boolean** | **`true` if the current user follows this seller; otherwise `false`.** |
| `user` | object | `{ id, username, profile_picture }` — **use `user.id` for follow/unfollow** |

**Frontend usage:** Show `seller.follower_count` on the product card or seller chip. Use `seller.is_followed` to show “Follow” vs “Following” and to call follow/unfollow with `seller.user.id`.

---

## 2. Follow / Unfollow (by user id)

Follow is **user-based**: you follow the **user** who owns the shop/seller account. Use **`seller.user.id`** (or `shop.user.id` from shop APIs) as `followee_id`.

| Action | Method | Path | Body | Response |
|--------|--------|------|------|----------|
| **Follow** | POST | `/socials/follow/<followee_id>` | None | 200 + follow object, or 409 already following |
| **Unfollow** | DELETE | `/socials/follow/<followee_id>` | None | 204 No content |

**Path parameter:**

- `followee_id` — **user id** (UUID string), e.g. `seller.user.id` from a feed product or `user.id` from shop detail.

**Follow response (200):**

```json
{
  "follower_id": "USR_current_user",
  "followee_id": "USR_seller_user",
  "follow_type": "customer"
}
```

**Errors:**

- **401** — Not authenticated.
- **409** — Already following (Follow only).

**Frontend flow:**

1. From feed or shop profile, get `seller.user.id` (or `shop.user.id`).
2. If `seller.is_followed` (or `shop.is_followed`) is `false`: show “Follow”, on tap call `POST /socials/follow/<seller.user.id>`.
3. If `true`: show “Following”, on tap call `DELETE /socials/follow/<seller.user.id>`.
4. After success, either refetch feed/shop to get updated `follower_count` and `is_followed`, or update local state optimistically.

---

## 3. Like / Unlike post (toggle)

Used when the user taps the like button on a post (e.g. in feed or post detail).

| Action | Method | Path | Body | Response |
|--------|--------|------|------|----------|
| **Toggle like** | POST | `/socials/posts/<post_id>/like` | None | 200 + like object |

**Path parameter:**

- `post_id` — Post id from feed (e.g. `PST_xxx`).

**Response (200):** e.g. `{ "user_id": "...", "post_id": "PST_xxx", "created_at": "..." }`. The backend **toggles**: if the user already liked, it unlikes; otherwise it likes.

**Frontend:** After calling this, set `liked_by_me` to the new state and update `likes_count` (e.g. ±1) in local state, or refetch the feed/post.

---

## 4. TypeScript-friendly summary

```ts
// Feed item (discriminated by type)
type FeedPost = {
  id: string;
  type: "post";
  caption: string | null;
  user: { id: string; username: string; profile_picture: string | null };
  media: Media[];
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;  // current user liked this post
  created_at: string;
  score?: number;
  niche: NicheInfo | null;
};

type FeedProduct = {
  id: string;
  type: "product";
  name: string;
  description: string | null;
  price: number;
  seller: {
    id: number;
    shop_name: string;
    follower_count: number;
    is_followed: boolean;
    user: { id: string; username: string; profile_picture: string | null };
  };
  images: Image[];
  rating: number | null;
  reviews_count: number;
  created_at: string;
  score?: number;
};

type FeedItem = FeedPost | FeedProduct;

// Follow: POST /socials/follow/:followeeId  (followeeId = seller.user.id)
// Unfollow: DELETE /socials/follow/:followeeId
// Like post: POST /socials/posts/:postId/like
```

---

## 5. Testing with Postman (local)

A Postman collection is provided to exercise these APIs on your local server.

**Collection file:** `docs/postman/Feed_And_Follow.postman_collection.json`

**Setup:**

1. **Import** the collection in Postman (Import → Upload the JSON file).
2. **Set variables** (Collection variables or Environment):
   - `base_url` = `http://localhost:8000` (or your backend URL without trailing slash).
3. **Run order:**
   - **1. Auth > Login (session cookie)** — Use valid email/password for your local DB (e.g. `buyer@example.com` / `password123`). This sets the session cookie for the host.
   - **2. Feed > Feed - For You** — Returns feed; test script saves `post_id` and `followee_id` from the first post and first product seller.
   - **3. Follow / Unfollow** — Uses `followee_id` (seller’s user id). You can set it manually or run “Feed - For You” first.
   - **4. Post like > Like / Unlike post** — Uses `post_id`. Set manually or run “Feed - For You” first.

**Auth:** The app uses **session cookies**. After Login, Postman sends the stored cookie for the same host; no Bearer token is required. If a request returns 401, run Login again.

---

## 6. Related docs

- **MOBILE_HOME_FEED_API_CONTRACTS.md** — Full feed and search contracts.
- **SHOP_STRIP_HOME_DESIGN_AND_API.md** — Shops, seller profile, and follow (same follow endpoints).
- **FEED_ACTIONS_PRODUCTS_POSTS_AND_WEBSOCKETS.md** — All feed actions (view, like, comments, cart, etc.).
