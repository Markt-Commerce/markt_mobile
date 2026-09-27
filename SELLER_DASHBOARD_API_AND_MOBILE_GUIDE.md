# Seller Dashboard — API Contract & Mobile (React Native) Guide

This document provides:
1. **API contract** — all endpoints required for a seller dashboard (stats, charts, orders, inventory, chats, requests, notifications).
2. **React Native instructions** — how to build a modern, beautiful seller dashboard for mobile.

**Base URL:** `{API_BASE}/api/v1`. **Auth:** All seller endpoints require login and seller role (session cookie). Use `seller_required` gates; 403 if user is not a seller.

---

## Part 1: API Contract

### 1. Overview metrics (dashboard header)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/sellers/analytics/overview` | GET | Revenue, orders, views, conversion for a time window |

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `window_days` | int | 30 | Days to aggregate (1–365) |

**Response (200):**

```json
{
  "revenue_30d": 125000.50,
  "orders_30d": 42,
  "views_30d": 1200,
  "conversion_30d": 3.5
}
```

- **revenue_30d** — Total revenue in the window (sum of order item price × quantity).
- **orders_30d** — Number of order items.
- **views_30d** — Product view count.
- **conversion_30d** — Conversion rate (orders / views × 100), rounded to 2 decimals.

---

### 2. Chart / timeseries data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/sellers/analytics/timeseries` | GET | Time-bucketed data for graphs |

**Query parameters (all required):**

| Param | Type | Values | Description |
|-------|------|--------|-------------|
| `metric` | string | `sales`, `orders`, `views`, `conversion` | Metric to plot |
| `bucket` | string | `day`, `week`, `month` | Time bucket |
| `start_date` | datetime | ISO 8601 | Start of range |
| `end_date` | datetime | ISO 8601 | End of range |

**Response (200):**

```json
{
  "metric": "sales",
  "bucket": "day",
  "series": [
    { "bucket_start": "2025-02-01T00:00:00", "value": 5000.0 },
    { "bucket_start": "2025-02-02T00:00:00", "value": 3200.0 }
  ],
  "totals": {
    "value": 125000.50,
    "count": 42
  }
}
```

- **series** — Points for chart; `bucket_start` is ISO datetime; `value` is the metric value.
- **totals** — Aggregate for the range.

---

### 3. Start cards (onboarding / action checklist)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/sellers/start-cards` | GET | Onboarding cards with completion status |

**Response (200):**

```json
{
  "items": [
    {
      "key": "profile_setup",
      "title": "Complete Your Profile",
      "description": "Add your shop name, description, and profile picture to build trust with customers.",
      "cta": { "label": "Complete Profile", "href": "/seller/profile" },
      "completed": false,
      "progress": { "current": 2, "target": 3 }
    },
    {
      "key": "add_first_product",
      "title": "Add Your First Product",
      "description": "Start selling by adding your first product to your shop.",
      "cta": { "label": "Add Product", "href": "/seller/products/add" },
      "completed": true,
      "progress": { "current": 1, "target": 1 }
    },
    {
      "key": "verify_email",
      "title": "Verify Your Email",
      "description": "Verify your email address to secure your account.",
      "cta": { "label": "Verify Email", "href": "/verify-email" },
      "completed": true
    },
    {
      "key": "fulfill_pending_orders",
      "title": "Fulfill Pending Orders",
      "description": "You have 3 pending orders waiting to be processed.",
      "cta": { "label": "View Orders", "href": "/seller/orders" },
      "completed": false,
      "progress": { "current": 3, "target": 0 }
    },
    {
      "key": "publish_first_post",
      "title": "Engage Your Audience",
      "description": "Publish your first social post to connect with customers.",
      "cta": { "label": "Create Post", "href": "/posts/create" },
      "completed": false,
      "progress": { "current": 0, "target": 1 }
    }
  ],
  "metadata": {
    "seller_id": 1,
    "generated_at": "2025-02-15T12:00:00"
  }
}
```

---

### 4. Recent orders (seller view)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/seller` | GET | List order items for the current seller |

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page |
| `status` | string | — | Filter by status: `pending`, `processing`, `shipped`, `delivered` |

**Response (200):**

```json
{
  "items": [
    {
      "id": 123,
      "order_id": "ORD_xxx",
      "product": {
        "id": "PRD_xxx",
        "name": "Product Name",
        "price": 99.99
      },
      "variant": null,
      "quantity": 2,
      "price": 99.99,
      "status": "pending",
      "created_at": "2025-02-15T10:00:00",
      "order": {
        "id": "ORD_xxx",
        "order_number": "#1234",
        "buyer": {
          "id": "USR_xxx",
          "username": "buyer_name",
          "profile_picture": "url"
        },
        "created_at": "2025-02-15T10:00:00"
      }
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

**Order item status values:** `pending` → `processing` → `shipped` → `delivered`.

---

### 5. Order statistics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/seller/stats` | GET | Order counts and monthly earnings |

**Response (200):**

```json
{
  "total_orders": 156,
  "pending_orders": 5,
  "monthly_earnings": 125000.50
}
```

---

### 6. Update order item status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/seller/items/<order_item_id>` | PATCH | Update status of an order item |

**Body:**

```json
{
  "status": "processing"
}
```

**Status transitions:** `pending` → `processing` | `cancelled`; `processing` → `shipped` | `cancelled`; `shipped` → `delivered`.

**Response (200):** Updated order item (OrderItemSchema).

---

### 7. Inventory / products (seller’s listings)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products/seller/my-products` | GET | List seller’s products |
| `/products` | POST | Create product |
| `/products/<product_id>` | PUT | Update product |
| `/products/<product_id>` | DELETE | Delete product |
| `/products/bulk` | POST | Bulk create products |

**GET my-products query:**

| Param | Type | Default |
|-------|------|---------|
| `page` | int | 1 |
| `per_page` | int | 20 |

**Response (200):** Same shape as product search: `{ "items": [...], "pagination": {...} }`. Each item is full ProductSchema (id, name, description, price, images, seller, categories, view_count, average_rating, etc.).

---

### 8. Chats (conversations with buyers)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chats/rooms` | GET | List chat rooms for current user |

**Query:** `page`, `per_page`.

**Response:** See CHATS_API_AND_SOCKETS.md. Rooms include `other_user`, `product`, `request`, `last_message`, `unread_count`.

---

### 9. Requests (buyer requests — sellers can browse and offer)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/requests` | GET | Browse buyer requests (sellers can see all) |
| `/requests/<request_id>` | GET | Request detail |
| `/requests/<request_id>/offers` | POST | Create offer (seller) |
| `/requests/offers/<offer_id>/withdraw` | POST | Withdraw offer |

See REQUESTS_AND_OFFERS_BUYER_SELLER_MODES.md for full contract.

---

### 10. Notifications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | List notifications |
| `/notifications/unread/count` | GET | Unread count |
| `/notifications/mark-read` | POST | Mark as read |

**Query (GET):** `page`, `per_page`.

---

### 11. Seller profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/profile/seller` | GET | Get seller profile (requires seller) |
| `/users/profile/seller` | PUT | Update seller profile |

---

### 12. Gaps / TODO

- **`GET /payments/admin/stats`** — Placeholder; payment stats for sellers not yet implemented. Use `revenue_30d` and `monthly_earnings` from analytics/orders for now.
- **Order tracking** — `GET /orders/<order_id>/track` is TODO; no real-time shipping map yet.

---

## Part 2: React Native Seller Dashboard — Implementation Guide

### Design principles (modern, beautiful)

1. **Card-first** — Metrics, orders, and products in clear cards; avoid dense tables on mobile.
2. **Progressive disclosure** — Summary on dashboard; drill down into orders, products, chats.
3. **Pull-to-refresh + optimistic updates** — Keep data fresh; update UI before API confirms where safe.
4. **Skeleton loading** — Show skeleton cards while loading; avoid spinners in the middle of content.
5. **Empty states** — Friendly copy and CTAs when no orders, products, or chats.
6. **Dark mode support** — Use theme tokens; avoid hard-coded colors.

---

### 2.1 Screen structure (recommended)

```
Seller Dashboard (home)
├── Header: shop name, avatar, quick actions
├── Metrics strip (4 cards or 2×2): Revenue, Orders, Views, Conversion
├── Chart section: Sales / Orders over time (tabs or segmented control)
├── Start cards (collapsible): onboarding checklist
├── Recent orders: last 5–10 items, "View all" → Orders screen
├── Quick links: Inventory, Chats, Requests, Notifications
└── FAB or bottom nav: Create product / post

Orders screen (seller)
├── Tabs: All | Pending | Processing | Shipped | Delivered
├── List of order items with buyer, product, quantity, status
├── Tap item → Order detail → Update status
└── Pull-to-refresh, pagination

Inventory screen
├── List/grid of products (image, name, price, stock, status)
├── Search / filter
├── "Add product" FAB
└── Tap → Product detail / edit
```

---

### 2.2 Metrics strip (dashboard header)

- **Layout:** Horizontal `ScrollView` or 2×2 grid of metric cards.
- **Cards:** Large number (revenue, count) + label + optional trend (e.g. “↑ 12% vs last period” if backend adds it).
- **Style:** Rounded corners, subtle shadow or border; use brand accent for key metric (e.g. revenue).
- **API:** `GET /users/sellers/analytics/overview?window_days=30`. Show skeleton while loading.
- **Optional:** Segmented control for 7d / 30d / 90d; change `window_days` and refetch.

---

### 2.3 Chart section

- **Library:** `react-native-gifted-charts`, `victory-native`, or `react-native-svg` + custom line/bar.
- **Metric tabs:** Sales | Orders | Views | Conversion.
- **Bucket control:** Day | Week | Month.
- **API:** `GET /users/sellers/analytics/timeseries?metric=sales&bucket=day&start_date=...&end_date=...`.
- **Defaults:** Last 30 days, `bucket=day` for sales; format `bucket_start` for x-axis labels.
- **Empty:** Show “No data yet” with friendly message when `series` is empty.

---

### 2.4 Start cards (onboarding)

- **Placement:** Below metrics, collapsible section (“Getting started” with expand/collapse).
- **Cards:** Title, description, progress bar (if `progress`), CTA button. Dim or hide when `completed`.
- **CTA:** Map `cta.href` to RN routes (e.g. `/seller/profile`, `/seller/products/add`).
- **API:** `GET /users/sellers/start-cards`. Hide section when all completed, or show “All set” badge.

---

### 2.5 Recent orders

- **Data:** `GET /orders/seller?page=1&per_page=10` (no status filter for “recent”).
- **Card:** Buyer avatar + name, product thumbnail + name, quantity, price, status badge.
- **Status badge:** Color by status (e.g. pending = orange, processing = blue, shipped = purple, delivered = green).
- **Tap:** Navigate to order detail; allow status update (PATCH) with bottom sheet or modal.
- **Empty:** “No orders yet. Share your products to get your first sale!”

---

### 2.6 Inventory / products

- **List:** `GET /products/seller/my-products?page=1&per_page=20`. Grid (2 cols) or list with image, name, price, stock.
- **Create:** Navigate to create-product screen; `POST /products` with ProductCreateSchema.
- **Edit/delete:** Product detail screen; `PUT /products/<id>` and `DELETE /products/<id>`.
- **Empty:** “Add your first product” CTA.

---

### 2.7 Chats & requests

- **Chats:** `GET /chats/rooms`; list rooms with `other_user`, `last_message`, `unread_count`. Badge on icon if unread.
- **Requests:** `GET /requests`; browse buyer requests; tap → detail → create offer. See REQUESTS_AND_OFFERS doc.

---

### 2.8 Notifications

- **Badge:** `GET /notifications/unread/count` for header/app badge.
- **List:** `GET /notifications`; tap → mark read via `POST /notifications/mark-read`.

---

### 2.9 Loading & error states

- **Skeleton:** Use `expo-linear-gradient` or placeholder components for metrics, chart, orders.
- **Error:** Inline message + “Retry” button; avoid full-screen error unless critical.
- **Offline:** Queue writes; show banner when offline; retry on reconnect.

---

### 2.10 Recommended tech stack

- **Navigation:** React Navigation (stack + tabs or drawer).
- **State:** TanStack Query (React Query) for server state; Zustand or Context for minimal local state.
- **Charts:** `react-native-gifted-charts` or `victory-native`.
- **Forms:** React Hook Form + Zod for create/edit product.
- **UI:** NativeWind (Tailwind) or custom theme tokens for consistency and dark mode.

---

### 2.11 API call order (initial dashboard load)

1. `GET /users/sellers/analytics/overview?window_days=30`
2. `GET /users/sellers/analytics/timeseries?metric=sales&bucket=day&start_date=...&end_date=...`
3. `GET /users/sellers/start-cards`
4. `GET /orders/seller?page=1&per_page=10`
5. `GET /notifications/unread/count` (for badge)

Run 1–4 in parallel where possible; 5 can be parallel or deferred. Use React Query with appropriate `staleTime` (e.g. 60s for overview, 5m for start-cards).

---

### 2.12 TypeScript types (summary)

```ts
interface AnalyticsOverview {
  revenue_30d: number;
  orders_30d: number;
  views_30d: number;
  conversion_30d: number;
}

interface TimeseriesPoint {
  bucket_start: string;
  value: number;
}

interface AnalyticsTimeseries {
  metric: string;
  bucket: string;
  series: TimeseriesPoint[];
  totals: { value: number; count: number };
}

interface SellerOrderItem {
  id: number;
  order_id: string;
  product: { id: string; name: string; price: number };
  quantity: number;
  price: number;
  status: "pending" | "processing" | "shipped" | "delivered";
  order: { order_number: string; buyer: { username: string } };
}

interface StartCard {
  key: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  completed: boolean;
  progress?: { current: number; target: number };
}
```

---

## Part 3: Quick reference — endpoint summary

| Purpose | Method | Path |
|---------|--------|------|
| Metrics overview | GET | `/users/sellers/analytics/overview` |
| Chart data | GET | `/users/sellers/analytics/timeseries` |
| Start cards | GET | `/users/sellers/start-cards` |
| Recent orders | GET | `/orders/seller` |
| Order stats | GET | `/orders/seller/stats` |
| Update order item status | PATCH | `/orders/seller/items/<id>` |
| My products | GET | `/products/seller/my-products` |
| Create product | POST | `/products` |
| Update product | PUT | `/products/<id>` |
| Delete product | DELETE | `/products/<id>` |
| Chat rooms | GET | `/chats/rooms` |
| Browse requests | GET | `/requests` |
| Notifications | GET | `/notifications` |
| Unread count | GET | `/notifications/unread/count` |
| Seller profile | GET/PUT | `/users/profile/seller` |

All paths are relative to `{API_BASE}/api/v1`. Auth required; 403 if not a seller.
