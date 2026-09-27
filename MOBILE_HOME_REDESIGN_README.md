# Mobile Home Page Redesign — Overview

This folder contains **instructions and docs** for redesigning the React Native (Expo) home screen to use the **feed endpoints** (one hybrid list per tab) and **global search**, with a modern layout and solid caching/pagination.

---

## What’s included

| Document | Purpose |
|----------|---------|
| **[MOBILE_HOME_FEED_API_CONTRACTS.md](./MOBILE_HOME_FEED_API_CONTRACTS.md)** | **API contracts:** Exact request/response for feed (For You, Discover, Trending, Following, Niche) and global search. Use for types and integration. |
| **[MOBILE_HOME_DESIGN_AND_UX_GUIDE.md](./MOBILE_HOME_DESIGN_AND_UX_GUIDE.md)** | **Design & UX:** Layout inspiration (Twitter, Reddit, Chowdeck, e‑commerce), post vs product cards, tabs, and best practices. |
| **[MOBILE_HOME_CACHING_PAGINATION_OPTIMIZATION.md](./MOBILE_HOME_CACHING_PAGINATION_OPTIMIZATION.md)** | **Caching & optimization:** Pagination (aligned with backend), client caching, pull-to-refresh, list performance, search debouncing. |

---

## Quick mapping: tabs and endpoints

- **For You** → `GET /api/v1/socials/feed?page=1&per_page=20`
- **Discover** → `GET /api/v1/socials/feed/discover?page=1&per_page=20`
- **Trending** → `GET /api/v1/socials/feed/trending?page=1&per_page=20`
- **Following** → `GET /api/v1/socials/feed/following?page=1&per_page=20`
- **Niche** → `GET /api/v1/socials/feed/niche/{niche_id}?page=1&per_page=20`
- **Global search** → `GET /api/v1/search/?search=...&page=1&per_page=20`

Use **only** these for the home feed; do **not** call product and post list endpoints separately for the main feed.

---

## Suggested implementation order

1. **Types and API layer**  
   From [MOBILE_HOME_FEED_API_CONTRACTS.md](./MOBILE_HOME_FEED_API_CONTRACTS.md): define TS types for feed item (post vs product), pagination, and search response; implement one function per endpoint (with auth).

2. **Home layout and tabs**  
   From [MOBILE_HOME_DESIGN_AND_UX_GUIDE.md](./MOBILE_HOME_DESIGN_AND_UX_GUIDE.md): top bar with search, horizontal tabs (For You, Discover, etc.), one `FlatList` per tab (or one list with tab-driven data).

3. **Post and product cards**  
   Render by `item.type`: post card (author, caption, media, niche, engagement) and product card (image, name, price, seller, CTA). Match the design guide for hierarchy and CTAs.

4. **Pagination and caching**  
   From [MOBILE_HOME_CACHING_PAGINATION_OPTIMIZATION.md](./MOBILE_HOME_CACHING_PAGINATION_OPTIMIZATION.md): per-tab state, load more on scroll end using `has_next`, pull-to-refresh with optional `force_refresh`, in-memory cache per tab.

5. **Search screen**  
   Global search in header → search screen; debounced request to `/api/v1/search/`; show products, posts, and sellers (sections or tabs). Reuse product/post card components where it makes sense.

6. **Polish**  
   Empty/error states, accessibility labels, image placeholders, and optional persisted cache for cold start.

---

## Outcome

- **Single feed API per tab** — no separate product/post calls for the main feed.
- **Clear UX** — posts feel social, products feel shoppable, in one scroll.
- **Smooth behavior** — pagination and caching aligned with the backend; list and search optimized for performance.

Use these three docs together for a full, self-sufficient implementation of the new home experience.
