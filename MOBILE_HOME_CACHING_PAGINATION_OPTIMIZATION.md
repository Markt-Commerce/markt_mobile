# Mobile Home — Caching, Pagination & Optimization

This document describes **standard practices** for using the feed and search APIs in the React Native (Expo) app: pagination (aligned with the backend), caching for a smooth feel, and optimization so the home screen stays fast and predictable.

---

## 1. Backend behavior (what the API already does)

- **Feed:** Returns `items` and `pagination` with `page`, `per_page`, `total`, `pages`, `has_next`, `has_prev`. Uses **offset-based** pagination: you request `page=1`, then `page=2`, etc.
- **Caching (server):** The main feed (`/socials/feed`) can use Redis; the `force_refresh` query param skips cache when you need fresh data (e.g. after pull-to-refresh).
- **Search:** Returns `products`, `posts`, `sellers` plus `page` and `per_page`; same offset style. No `has_next` in the response — derive it with `items.length === per_page` or by requesting `per_page + 1` and trimming (if the API supports it; otherwise use a “Load more” only when you get a full page).

Use these facts to design client-side caching and pagination so they **match** the backend and feel smooth.

---

## 2. Pagination (client)

### 2.1 One list per tab

- Keep **separate state per tab** (For You, Discover, Trending, Following, Niche): each has its own `items` array and `page` (and optionally `hasNext`).
- **Initial load:** Request `page=1` and `per_page=20` (or 10). Append results to that tab’s `items`.
- **Load more:** When the user scrolls near the end (e.g. `onEndReached` in `FlatList`), request the **next** `page` (e.g. 2, 3) and **append** to the same `items`. Use `pagination.has_next` to decide whether to show “Load more” or stop.

### 2.2 Avoiding duplicate requests

- **Guard:** Don’t fire the next page request while a request for that tab is already in flight; disable “Load more” or show a small spinner at the bottom during fetch.
- **Idempotent pages:** Always use the same `per_page` for a tab (e.g. always 20). Don’t mix page sizes for the same feed.

### 2.3 Pull-to-refresh

- On pull-to-refresh for a tab:
  - Call the **same** feed endpoint with `page=1` and `per_page=20`.
  - For the **main feed only**, you can send `force_refresh=true` so the server bypasses cache.
  - **Replace** that tab’s `items` with the new response (don’t append). Reset `page` to 1 and recompute `has_next` from the new `pagination`.

### 2.4 Empty and error states

- If `items.length === 0` after load, show an empty state (“No posts yet”, “Follow sellers to see their products”, etc.).
- On error: keep previous `items` if any; show a toast or inline message and optionally a “Retry” button that reuses the same `page`.

---

## 3. Caching (client)

### 3.1 In-memory cache per tab

- **What:** Keep the last fetched `items` and `pagination` per tab in memory (e.g. React state or a small store/keyed by `feedType`).
- **When:** After every successful feed response, update that tab’s cache.
- **On tab switch:** If the tab already has cached `items`, render them immediately (no loading spinner for the list); optionally refresh in the background and replace if you want fresh data when switching back.

### 3.2 Stale-while-revalidate (optional)

- Show cached data immediately when the user opens Home or switches to a tab.
- In the background, request `page=1` (and `per_page=20`) for that tab. When the response arrives, replace the list (and reset to page 1) so the user sees fresh data without waiting.

### 3.3 Cache invalidation

- **After pull-to-refresh:** Already replacing the list; cache for that tab is updated.
- **After creating a post / liking / commenting:** Invalidate only the tabs that could show that content (e.g. For You, Following) and refetch page 1 or refresh in background.
- **After long absence:** When the app comes to foreground after a long time (e.g. > 5–10 minutes), you can refetch the current tab’s first page in the background and replace.

### 3.4 Persistence (optional)

- For a smoother cold start, you can persist the last feed response per tab (e.g. AsyncStorage or MMKV) and restore it on app launch while refetching in the background. Be mindful of size (e.g. only last 20–40 items per tab) and avoid storing huge payloads.

---

## 4. Optimization

### 4.1 List performance (FlatList)

- Use **`keyExtractor`** with a stable id (e.g. `item.id`).
- Use **`getItemType`** if your list has two types (post vs product) so the list can recycle views efficiently: return e.g. `'post'` or `'product'` based on `item.type`.
- **`windowSize`** and **`maxToRenderPerBatch`**: keep default or slightly reduce if you have heavy cards; increase slightly if you want fewer blank areas when scrolling fast.
- **`removeClippedSubviews`**: enable on Android (and where supported) to reduce overdraw.
- **Image loading:** Use an image component that supports lazy loading and placeholders (e.g. `expo-image`). Limit resolution (e.g. thumbnails) when possible; the backend often returns URLs that can be resized via query params if supported.

### 4.2 Avoiding over-fetching

- Don’t prefetch every tab on home mount. Load the **current tab** first; when the user switches tabs, load that tab’s feed if not cached.
- For “Load more,” request only the **next** page; don’t re-request previous pages.

### 4.3 Search

- **Debounce** input (e.g. 300–400 ms) before calling the global search API.
- If the user clears the query, you can either call the API with an empty term (backend returns empty lists) or skip the request and show a recent-searches / suggestions UI.
- Cache recent search results in memory (e.g. by query string) so repeated typing doesn’t hit the API every time; invalidate or cap size (e.g. last 10 queries).

---

## 5. Summary checklist

| Practice | Recommendation |
|----------|----------------|
| **Pagination** | One list per tab; `page=1` first, then increment for “Load more”; use `pagination.has_next`. |
| **Pull-to-refresh** | Request `page=1`, use `force_refresh=true` for main feed if desired; replace list and reset page. |
| **Caching** | In-memory cache per tab; show cache on tab switch; optional stale-while-revalidate. |
| **Invalidation** | After refresh, after post/like/comment, and optionally when app returns to foreground. |
| **List** | Stable keys, `getItemType` for post/product, tuned `windowSize`/`maxToRenderPerBatch`, lazy images. |
| **Search** | Debounce; optional in-memory cache for recent queries. |

Following these practices will give you a smooth, predictable home experience that aligns with the backend’s feed and search APIs and keeps the app responsive as the user scrolls and switches tabs.
