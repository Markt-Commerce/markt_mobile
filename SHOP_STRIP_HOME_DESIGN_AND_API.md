# Shops on Home — Instagram Story–Style Strip: Design & API

This doc gives **modern design instructions** and **API contracts** for showing **shops (sellers)** on the home page in an **Instagram story–style** horizontal strip: circular shop avatars, tap to open seller profile (with products, posts, follow), and a **Discover more** pattern when the user base grows. It also clarifies how **follow** works (by user id) so the frontend can wire it correctly.

---

## 1. Design: Instagram story–style shop strip

### 1.1 Layout (top of home, above the feed)

- **Position:** Directly under the top app bar (logo, search, notifications). Above the main feed (For You / Discover, etc.).
- **Component:** A **horizontal scrollable** row (e.g. `ScrollView` horizontal or `FlatList` horizontal with one row).
- **Items:** Each item is a **circle** (avatar) with the **shop name** (or username) below, like Instagram stories. Tapping a circle opens the **seller profile** screen (shop details, products, posts, follow).

### 1.2 Circle content and states

- **Avatar:** Use the shop’s profile image. Backend provides this as `user.profile_picture` on the shop object (sellers use their user profile picture; there is no separate “shop logo” in the current API). Fallback: placeholder or first letter of `shop_name`.
- **Label:** Under the circle, show **shop name** (`shop_name`) or, for a more social feel, **username** (`user.username`). Keep to one line with ellipsis if long.
- **Ring / state (optional):**
  - **Colored ring** (e.g. gradient or accent) can mean: “has new content”, “verified”, or “recently active”. Backend currently returns `verification_status`; you can show a verified ring/badge for verified shops. “New content” could be derived later (e.g. `last_activity`) if the API adds it.
  - **No ring** or muted ring: already viewed or no special state. Same as Instagram’s “viewed” vs “unviewed” story.

### 1.3 “Discover more” for scale

- After the user scrolls through a **fixed number** of circles (e.g. 8–12), show a final tile: **“Discover more”** (or “More shops”).
- **Tap action:** Navigate to a **dedicated discovery screen** (e.g. “Shops” or “Discover shops”) that uses the full **shop list/search** API with filters, categories, and pagination.
- This keeps the home strip short and performant while still offering deep discovery as the catalog grows.

### 1.4 Order and content of the strip

- **Option A (recommended for “story” feel):** Populate the strip with **trending shops** (`GET /api/v1/users/shops/trending`). Limit to e.g. 10–15 items, then “Discover more”.
- **Option B:** Use **search/list** with default params (`GET /api/v1/users/shops?per_page=12&active_only=true`) and append “Discover more” after that page.
- **Option C:** Mix: first 2–3 “Your follow” or “Suggested for you”, then trending, then “Discover more”. This would require backend support for “shops the user follows” or “suggested shops”; currently you can use trending + list.

### 1.5 Accessibility and polish

- **Touch target:** Each circle + label should be at least 44pt; the whole item (circle + text) is tappable.
- **Loading:** Show skeleton circles or placeholders while the strip loads.
- **Empty state:** If no shops, hide the strip or show a single “Discover shops” CTA.

---

## 2. Seller profile screen (after tap)

When the user taps a shop circle:

- **Route:** Open a **Seller / Shop profile** screen (e.g. `/shop/:shopId` or `ShopProfileScreen`).
- **Content:** Use **shop detail** API: header (avatar, shop name, description, verification, stats), then sections for **products** and **posts** (recent items). Show a **Follow** button that uses the **follow** API with the shop’s **user id**.

### 2.1 Header

- Shop avatar, name, username, verification badge, short description.
- Stats: **follower count**, **product count**, **post count** (from shop detail `stats`).
- **Follow / Unfollow** button: call follow API with `shop.user.id`; toggle label and state using `is_followed` from shop detail.

### 2.2 Products and posts

- **Current API:** `GET /api/v1/users/shops/<shop_id>` returns **recent_products** (e.g. 6) and **recent_posts** (e.g. 6). Use these for the profile screen.
- **“View all”:** For a full product list by this shop, the backend does not yet expose a public `GET /shops/<shop_id>/products`. Options: (a) add a backend route like `GET /api/v1/users/shops/<shop_id>/products` (paginated), or (b) for now only show “Recent” and link “View all” to a general product search filtered by shop name/search until such an endpoint exists. Documented below as a backend consideration.

---

## 3. API contract (shops and follow)

Base URL: `{API_BASE}/api/v1`. Auth: session cookie; optional for read-only shop list/detail.

### 3.1 List shops for the strip (trending)

**Endpoint:** `GET /api/v1/users/shops/trending`

**Auth:** Optional (no auth required).

**Response (200):**

```json
{
  "shops": [
    {
      "id": 1,
      "shop_name": "string",
      "shop_slug": "string",
      "description": "string or null",
      "categories": [{ "id": 1, "name": "string", "slug": "string" }],
      "total_rating": 0,
      "total_raters": 0,
      "average_rating": 0,
      "user": {
        "id": "user-uuid",
        "username": "string",
        "profile_picture": "url or null"
      }
    }
  ]
}
```

- **Usage:** Use for the Instagram-style strip. `user.profile_picture` = circle avatar; `shop_name` or `user.username` = label. `user.id` = id to use for **follow** (see below).
- **Note:** Backend may cap the list (e.g. 10). If you need more, use the shops list endpoint with pagination and show “Discover more” after the first page.

### 3.2 List/search shops (discovery and “Discover more”)

**Endpoint:** `GET /api/v1/users/shops`

**Query parameters:**

| Parameter       | Type    | Default   | Description |
|----------------|---------|-----------|-------------|
| `page`         | integer | 1         | Page number. |
| `per_page`     | integer | 20        | Items per page (e.g. 20). |
| `search`       | string  | —         | Search in shop name, description, username. |
| `active_only`  | boolean | —         | If true, only active shops. |
| `verified_only`| boolean | —         | If true, only verified shops. |
| `category`     | string  | —         | Filter by category. |
| `sort_by`      | string  | "rating"  | One of: `rating`, `name`, `recent`, `followers`. |

**Auth:** Optional. If authenticated, each shop can include `is_followed`.

**Response (200):**

```json
{
  "shops": [
    {
      "id": 1,
      "shop_name": "string",
      "shop_slug": "string",
      "description": "string or null",
      "categories": [{ "id": 1, "name": "string", "slug": "string" }],
      "verification_status": "verified",
      "is_active": true,
      "total_rating": 0,
      "total_raters": 0,
      "average_rating": 0,
      "user": {
        "id": "user-uuid",
        "username": "string",
        "profile_picture": "url or null"
      },
      "stats": {
        "product_count": 0,
        "post_count": 0,
        "follower_count": 0
      },
      "is_followed": false
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

- **Usage:** “Discover more” screen: full list with search/filters and pagination. Use the same circle + label design in a grid or list.

### 3.3 Shop categories (filters)

**Endpoint:** `GET /api/v1/users/shops/categories`

**Auth:** Not required.

**Response (200):** `{ "categories": [ { "id": 1, "name": "string", "slug": "string" } ] }`

Use for filter chips or dropdowns on the Discover shops screen.

### 3.4 Shop detail (seller profile with products and posts)

**Endpoint:** `GET /api/v1/users/shops/<shop_id>`

**Path:** `shop_id` = integer (shop/seller id).

**Auth:** Optional. If authenticated, response includes `is_followed` and `can_follow`.

**Response (200):**

```json
{
  "id": 1,
  "shop_name": "string",
  "shop_slug": "string",
  "description": "string or null",
  "categories": [{ "id": 1, "name": "string", "slug": "string" }],
  "verification_status": "verified",
  "is_active": true,
  "total_rating": 0,
  "total_raters": 0,
  "average_rating": 0,
  "policies": {},
  "user": {
    "id": "user-uuid",
    "username": "string",
    "profile_picture": "url or null"
  },
  "stats": {
    "product_count": 10,
    "post_count": 5,
    "follower_count": 100
  },
  "recent_products": [
    {
      "id": "PRD_xxx",
      "name": "string",
      "price": 99.99,
      "image": "url or null"
    }
  ],
  "recent_posts": [
    {
      "id": "PST_xxx",
      "caption": "string",
      "media": [{ "url": "string", "type": "image", "alt_text": "string or null" }],
      "likes_count": 0,
      "comments_count": 0,
      "created_at": "2025-02-15T12:00:00"
    }
  ],
  "is_followed": false,
  "can_follow": true
}
```

- **Usage:** Seller profile screen: header (avatar, name, stats), Follow button (from `is_followed` / `can_follow`), then recent products and recent posts. `can_follow` is false when the viewer is the shop owner (`shop.user_id === current_user.id`).
- **Follow target:** Use `user.id` (UUID) for the follow API, not `shop.id`.

### 3.5 Follow / Unfollow (by user id)

Follow is **user-based**: you follow the **user** who owns the shop, not the shop id. Use `shop.user.id` from any shop payload.

**Follow:** `POST /api/v1/socials/follow/<followee_id>`

- **Path:** `followee_id` = **user id** (UUID string) of the shop owner (i.e. `shop.user.id`).
- **Auth:** Required.
- **Response (200):** `{ "follower_id": "...", "followee_id": "...", "follow_type": "customer" }` (or 409 if already following).

**Unfollow:** `DELETE /api/v1/socials/follow/<followee_id>`

- **Path:** Same `followee_id` (user id).
- **Auth:** Required.
- **Response (204):** No body.

**Frontend:** On seller profile, Follow button: if `is_followed` then show “Following” and call DELETE on tap; else show “Follow” and call POST. After success, refetch shop detail to get updated `is_followed` and `stats.follower_count`, or update local state optimistically.

---

## 4. Summary: flows

| User action           | Screen / component      | API |
|-----------------------|--------------------------|-----|
| Load home             | Shop strip (top)         | `GET /users/shops/trending` (or first page of `GET /users/shops`) |
| Scroll strip to end   | Show “Discover more”     | No extra call; navigate to Discover shops. |
| Tap “Discover more”   | Discover shops screen    | `GET /users/shops?page=1&per_page=20`, filters, pagination |
| Tap a shop circle     | Seller profile           | `GET /users/shops/<shop_id>` |
| Tap Follow on profile | Same screen              | `POST /socials/follow/<shop.user.id>` |
| Tap Following         | Same screen              | `DELETE /socials/follow/<shop.user.id>` |

---

## 5. Backend considerations (for product and follow)

- **Follow:** Already implemented. Follow is by **user id**; shop responses include `user.id`. No change required for “follow this shop” — the frontend uses `shop.user.id` as `followee_id`.
- **Optional: “View all products” for a shop.** Shop detail only returns a small `recent_products` list. A dedicated endpoint improves the seller profile UX:
  - **Option A:** `GET /api/v1/users/shops/<shop_id>/products?page=1&per_page=20` (public, paginated). Backend can call `ProductService.get_seller_products(shop_id, page, per_page)` (seller_id in products is the same as shop id).
  - **Option B:** Add `seller_id` (or `shop_id`) to the existing product list filter so `GET /api/v1/products?seller_id=<shop_id>` returns that shop’s products (if the products API allows it).
- **Optional: “Shops I follow” for strip.** If you want a “Following” segment in the strip, the backend could expose e.g. `GET /api/v1/users/shops/following` returning shops for users the current user follows. Not required for the initial story-style strip using trending + “Discover more”.

---

## 6. Design checklist

- [ ] Horizontal scrollable strip under the app bar; circles + label (shop name or username).
- [ ] Avatar from `user.profile_picture`; optional ring for verified or “new content” if/when API supports it.
- [ ] Tap circle → Seller profile screen (shop detail API).
- [ ] Seller profile: header (avatar, name, stats), Follow/Unfollow using `user.id`, recent products and posts.
- [ ] After N circles, show “Discover more” → Discover shops screen (list/search API with pagination).
- [ ] Follow/unfollow use `POST/DELETE /socials/follow/<user_id>` with `shop.user.id`; handle 401/403 per FRONTEND_ROLES_AND_SWITCHING.md.

This gives you a clear, modern, Instagram story–style shop strip and a single place for the shop/seller and follow API contracts.
