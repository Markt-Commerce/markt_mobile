# Buyer/Seller Navigation Redesign, Product Actions by Mode & Cart/Orders/Payments API

This doc gives **detailed instructions** for the Markt app redesign (FAB, bottom nav, profile → drawer, Orders screen with My Cart tab), **product actions by mode** (buyer vs seller on feed and product detail), **easy mode switching**, and the **full API contract for cart, orders, and payments** in buyer mode.

**Base URL:** `{API_BASE}/api/v1`. Auth: session cookie. **Current role:** `current_role` from profile (`"buyer"` or `"seller"`) drives which screens and actions are shown.

---

## Part 1: Redesign instructions (layout and navigation)

### 1.1 Top bar and profile → side drawer (Twitter-style)

- **Profile in top left:** Replace the old “Profile” tab in the bottom nav with a **circular profile avatar** (or generic person icon) in the **top-left** of the app bar. Tapping it opens a **side drawer** (slide-in from the left).
- **Drawer contents (inspiration: Twitter/X side pane):**
  - **Header:** User avatar, display name, handle/username, optional “X Following / Y Followers” (or omit if not in scope).
  - **Add account / Switch mode:** Icon + “Switch mode” or “Add account” — primary way to toggle between buyer and seller. On “Switch mode”, call `POST /api/v1/users/switch-role` (only if user has both accounts); then refresh app state and optionally show a toast (“Now in Seller mode”).
  - **List items:** Profile (link to full profile screen), Niches (link to niches/communities), Bookmarks (if you have them), Settings and privacy, Help Center (or equivalent). Adapt to your app’s features.
- **Right side of top bar:** Keep **notifications** (bell) and any other global actions. **Do not** put the “+” create action here — it moves to the FAB (below).
- **Center:** App logo or “Marketplace” / “Markt” title.

**Result:** Profile is no longer a bottom tab; it’s reached via the drawer (and optionally a dedicated Profile screen linked from the drawer).

---

### 1.2 Floating Action Button (FAB) — bottom right

- **Position:** Fixed at **bottom right** of the screen (above the bottom nav), with enough padding so it doesn’t overlap the tab bar. Use a single **“+”** icon (or similar).
- **On tap:** Open a **bottom sheet** (or small menu) with **mode-dependent options** and a **common** option:
  - **Buyer mode** (`current_role === "buyer"`):
    - **Create post** — Navigate to create-post screen (e.g. `POST /api/v1/socials/posts`).
    - **Create request** — Navigate to create-request screen (e.g. `POST /api/v1/requests/`).
    - **Switch mode** — Only show if user has both accounts (`is_buyer && is_seller`). Calls `POST /api/v1/users/switch-role`; then refresh UI (nav, FAB options, product actions).
  - **Seller mode** (`current_role === "seller"`):
    - **Create post** — Same as above.
    - **Create product** — Navigate to create-product screen (e.g. `POST /api/v1/products/`).
    - **Make offer** — Navigate to “Browse requests” (e.g. `GET /api/v1/requests/`); user picks a request then submits an offer (`POST /api/v1/requests/<request_id>/offers`).
    - **Switch mode** — Same as above (if dual-role).
  - **Both modes:** Always show **Switch mode** when the user has both buyer and seller accounts.
- **Visibility:** Show the FAB on **Home** (feed) and optionally on other main screens; hide or replace on dedicated “create” screens (e.g. create post, create request, create product) to avoid duplicate CTAs.

---

### 1.3 Bottom navigation — remove Cart; add Requests; Orders holds My Cart (Chowdeck-style)

- **Remove** the **Cart** tab from the bottom nav entirely.
- **Orders screen** becomes the single entry for “cart + orders” in buyer mode:
  - **Tabs inside Orders screen:** **My Cart** | **Ongoing** | **Completed** (Chowdeck-style).
  - **My Cart:** Shows current cart contents. Data: `GET /api/v1/cart/`. Actions: update quantity, remove item, “Checkout” → checkout flow (cart checkout or create order + pay). See Part 4 for full cart/checkout API.
  - **Ongoing:** List of orders that are not yet delivered (e.g. statuses: pending_payment, confirmed, processing, shipped). Data: `GET /api/v1/orders/` (buyer list); filter client-side or backend by status.
  - **Completed:** Delivered (or completed) orders. Same `GET /api/v1/orders/`, filter by completed status.
- **Replace** the old Cart tab with **Requests** (buyer-centric label):
  - In **buyer mode:** “Requests” tab → Requests screen with **My requests** and/or **Browse requests** (see [REQUESTS_AND_OFFERS_BUYER_SELLER_MODES.md](./REQUESTS_AND_OFFERS_BUYER_SELLER_MODES.md)).
  - In **seller mode:** Same “Requests” tab can show **Browse requests** (open requests to respond to with offers). No “My requests” for sellers (they use “Browse” only).
- **Suggested bottom nav (buyer mode):** **Home** | **Search** | **Requests** | **Orders** | **Messages** (or **Inbox**). Profile is in the drawer (top left).
- **Suggested bottom nav (seller mode):** **Home** | **Search** | **Requests** | **Orders** (seller orders: “Seller orders” / “Orders” with seller-specific list) | **Messages**. Optionally swap “Orders” for “Products” (my products) if you want seller focus on inventory; then Orders can still be reached from drawer or a sub-screen. Prefer keeping “Orders” so sellers see order management without extra taps.
- **Easy mode switching:** User can switch via (1) **FAB → Switch mode** or (2) **Drawer → Switch mode**. After switch, update `current_role` in app state, re-fetch profile if needed, and refresh the bottom nav labels/content (e.g. Requests screen shows different primary CTA: “My requests” vs “Browse requests”).

---

### 1.4 Home screen layout (unchanged from other docs, summarized)

- **Top:** App bar with **profile avatar (left)** → drawer, **title/logo (center)**, **notifications (right)**.
- **Below:** Search bar (→ global search), then horizontal **shop strip** (Instagram story–style), then **feed tabs** (For You, Discover, Trending, Following).
- **Feed:** Single list (feed API); post and product cards.
- **Bottom:** Bottom nav (no Cart; Requests + Orders as above).
- **FAB:** Fixed bottom right with “+”.

---

## Part 2: Product actions by mode (feed and product detail)

Actions on **products** (in feed or on product detail) **depend on current role** so the UI stays clear and avoids 403s.

### 2.1 Buyer mode — product actions

| Action | Where | API | Notes |
|--------|--------|-----|--------|
| View product | Feed card tap / search | `GET /api/v1/products/<product_id>` | Open product detail page. |
| Track view | Product detail | `POST /api/v1/products/<product_id>/view` | Optional; call when detail loads. |
| Add to cart | Product detail (or card CTA) | `POST /api/v1/cart/add` | Body: `product_id`, `quantity`, `variant_id`. Requires buyer role. |
| Reviews: list | Product detail | `GET /api/v1/products/<product_id>/reviews?page=1&per_page=10` | Anyone. |
| Reviews: create | Product detail | `POST /api/v1/products/<product_id>/reviews` | Logged-in user (buyer or seller). |
| Review upvote | Product detail | `POST /api/v1/products/reviews/<review_id>/upvote` | Logged-in. |
| Share | Product detail | `POST /api/v1/products/<product_id>/share` | Optional; backend may be placeholder. |

**Feed product card (buyer mode):** Show primary CTA **“Add to cart”** (or “View” that goes to detail where Add to cart is). Optionally show price, seller, rating. Do **not** show “Edit product” or “Delete product”.

**Product detail (buyer mode):** Show Add to cart, Reviews (list + create if logged in), Share. Do **not** show seller-only actions (edit/delete product).

### 2.2 Seller mode — product actions

| Action | Where | API | Notes |
|--------|--------|-----|--------|
| View product | Feed / search | `GET /api/v1/products/<product_id>` | Same as buyer. |
| Track view | Product detail | `POST /api/v1/products/<product_id>/view` | Optional. |
| Edit product | Product detail (own only) | `PUT /api/v1/products/<product_id>` | Only if `product.seller_id === current_user.seller_account.id`. |
| Delete product | Product detail (own only) | `DELETE /api/v1/products/<product_id>` | Same ownership. |
| Reviews: list / create / upvote | Product detail | Same as buyer | Sellers can also leave reviews. |

**Feed product card (seller mode):** Primary CTA **“View”** (go to detail). If the product is **owned by the current seller**, in **detail** show “Edit” / “Delete”. Do **not** show “Add to cart” as the main CTA in seller mode (you can still show it if the user is dual-role and you want to allow it, but backend requires buyer role for cart; so either hide “Add to cart” in seller mode or show it and on 403 prompt “Switch to buyer mode to add to cart”).

**Recommendation:** In **seller mode**, **hide** “Add to cart” on product cards and product detail to avoid confusion; show “View”, “Edit” (own), “Delete” (own). If the user switches to buyer mode, show “Add to cart” again.

### 2.3 Handling 403 on product actions

- **Add to cart** in seller mode → backend returns **403** (buyer required). Do **not** redirect to login. Show in-app message: “Switch to buyer mode to add to cart” and optionally a button that calls switch-role then retries or navigates to product again in buyer mode.
- **Edit/Delete product** when not owner → 403. Show “You can only edit your own products”.

---

## Part 3: Orders screen — My Cart, Ongoing, Completed (API mapping)

- **My Cart tab:**  
  - **GET** `/api/v1/cart/` — Load cart.  
  - **PUT** `/api/v1/cart/items/<item_id>` — Update quantity.  
  - **DELETE** `/api/v1/cart/items/<item_id>` — Remove item.  
  - **GET** `/api/v1/cart/summary` — Summary (item count, subtotal, total, discount).  
  - **Checkout:** Either **POST** `/api/v1/cart/checkout` (body: shipping_address, billing_address, notes, idempotency_key) or create order then pay (see Part 4). After checkout, redirect to Ongoing or order detail.

- **Ongoing tab:**  
  - **GET** `/api/v1/orders/` — List buyer orders. Filter client-side for non-completed statuses (e.g. pending_payment, confirmed, processing, shipped).  
  - **GET** `/api/v1/orders/<order_id>` — Order detail.  
  - **POST** `/api/v1/orders/<order_id>/pay` — Pay for order (see Part 4).

- **Completed tab:**  
  - Same **GET** `/api/v1/orders/`, filter for delivered/completed.

All of the above require **buyer** role (cart and buyer orders). Seller orders use **GET** `/api/v1/orders/seller?status=...&page=1&per_page=20` (seller mode; different screen or same Orders tab with a “Seller orders” sub-view).

---

## Part 4: API contract — Cart, Orders, Payments (buyer mode)

### 4.1 Cart

| Method | Endpoint | Auth | Body / notes | Response |
|--------|----------|------|--------------|----------|
| GET | `/api/v1/cart/` | Login, buyer | — | 200: CartSchema (id, buyer_id, expires_at, coupon_code, items[], total_items, subtotal). |
| DELETE | `/api/v1/cart/` | Login, buyer | — | 204. |
| POST | `/api/v1/cart/add` | Login, buyer | `{ "product_id": "PRD_xxx", "quantity": 1, "variant_id": null }` | 201: CartItemSchema. |
| PUT | `/api/v1/cart/items/<item_id>` | Login, buyer | `{ "quantity": 2 }` | 200: CartItemSchema. |
| DELETE | `/api/v1/cart/items/<item_id>` | Login, buyer | — | 204. |
| GET | `/api/v1/cart/summary` | Login, buyer | — | 200: CartSummarySchema (item_count, subtotal, total, discount). |
| POST | `/api/v1/cart/checkout` | Login, buyer | See below | 201: `{ "order_id", "message" }`. |

**Checkout body (CheckoutSchema):**

```json
{
  "shipping_address": { "street": "...", "city": "...", "state": "...", "country": "...", "postal_code": "..." },
  "billing_address": { "..." },
  "notes": null,
  "idempotency_key": "optional-uuid"
}
```

---

### 4.2 Orders (buyer)

| Method | Endpoint | Auth | Body / notes | Response |
|--------|----------|------|--------------|----------|
| GET | `/api/v1/orders/` | Login | — | 200: BuyerOrderSchema[] (id, order_number, status, subtotal, created_at, items). |
| GET | `/api/v1/orders/<order_id>` | Login | — | 200: OrderSchema (full order). |
| POST | `/api/v1/orders/` | Login | Create from cart: `{ "cart_id": 1, "shipping_address": {...}, "payment_method": "card", "customer_note": null }` | 201: OrderSchema. |
| POST | `/api/v1/orders/<order_id>/pay` | Login | Payment payload (see PaymentProcessSchema or PaymentSchema as used by route) | 200: OrderSchema. |

**Order status values (typical):** pending_payment, confirmed, processing, shipped, delivered, cancelled. Use for Ongoing vs Completed tabs.

---

### 4.3 Payments (buyer)

| Method | Endpoint | Auth | Body / notes | Response |
|--------|----------|------|--------------|----------|
| POST | `/api/v1/payments/create` | Login, buyer | `{ "order_id": "...", "amount": 99.99, "currency": "NGN", "method": "card", "metadata": {}, "idempotency_key": null }` | 201: PaymentSchema. |
| POST | `/api/v1/payments/initialize` | Login, buyer | Same as create | 200: `{ "payment_id", "authorization_url", "reference", "access_code" }` for card (redirect user to authorization_url); or payment_id + reference for bank transfer. |
| POST | `/api/v1/payments/<payment_id>/process` | Login, buyer | Card: `{ "authorization_code": "..." }` or `{ "card_token": "..." }`. Bank: `{ "bank": { "code": "057", "account_number": "..." } }` | 200: PaymentSchema. |
| GET | `/api/v1/payments/<payment_id>/verify` | Login | — | 200: Verification result (e.g. verified, amount). |
| GET | `/api/v1/payments/<payment_id>` | Login | — | 200: PaymentSchema. |
| GET | `/api/v1/payments/` | Login | `?page=1&per_page=20` | 200: PaymentListSchema (payments[], total, page, per_page, pages). |

**Typical flow (buyer):**  
1) Cart checkout → **POST /cart/checkout** → get `order_id`.  
2) Initialize payment → **POST /payments/initialize** with order_id and amount (from order total).  
3) Redirect user to `authorization_url` (card) or collect bank details and call **POST /payments/<payment_id>/process**.  
4) After redirect or success, **GET /payments/<payment_id>/verify** to confirm.  
5) Update order status in UI; show in Ongoing or Completed.

---

## Part 5: Mode switching — summary

- **Where:** (1) **FAB** → “Switch mode” in the bottom sheet. (2) **Drawer** (profile area) → “Switch mode” or “Add account”.
- **When:** Only show “Switch mode” if the user has **both** buyer and seller accounts (`is_buyer && is_seller` from profile).
- **API:** `POST /api/v1/users/switch-role` (no body). Response: `{ "success", "previous_role", "current_role", "message" }`.
- **After switch:** Update local `current_role`; refresh profile if needed; re-render bottom nav, FAB options, and product actions (e.g. show/hide Add to cart, Edit product). No need to re-login.

---

## Part 6: Document cross-reference

- **Feed data and tabs:** [MOBILE_HOME_FEED_API_CONTRACTS.md](./MOBILE_HOME_FEED_API_CONTRACTS.md).  
- **Feed actions (posts, products, cart, orders, WebSockets):** [FEED_ACTIONS_PRODUCTS_POSTS_AND_WEBSOCKETS.md](./FEED_ACTIONS_PRODUCTS_POSTS_AND_WEBSOCKETS.md).  
- **Requests and offers (buyer/seller screens, APIs):** [REQUESTS_AND_OFFERS_BUYER_SELLER_MODES.md](./REQUESTS_AND_OFFERS_BUYER_SELLER_MODES.md).  
- **Roles and 401/403:** [FRONTEND_ROLES_AND_SWITCHING.md](./FRONTEND_ROLES_AND_SWITCHING.md).  
- **Shops strip (home):** [SHOP_STRIP_HOME_DESIGN_AND_API.md](./SHOP_STRIP_HOME_DESIGN_AND_API.md).

Use this doc for the **layout redesign** (FAB, nav, drawer, Orders with My Cart), **product actions by mode**, and **cart/orders/payments API** in buyer mode.
