# Mobile Home Page — Design & UX Guide

This guide describes how to design the **home screen** of the React Native (Expo) app: layout inspiration (Twitter, Reddit, Chowdeck, modern e‑commerce), UX principles, and how to render **posts** vs **products** in one feed while keeping a modern, consistent feel.

---

## 1. Design goals

- **One feed, one API:** Use the hybrid feed endpoint so the home screen is a single list (For You / Discover / Following / Trending), not separate product and post lists.
- **Clear content types:** Users should instantly tell “social post” from “shoppable product” without clutter.
- **Familiar patterns:** Borrow from Twitter (timeline, tabs), Reddit (cards, communities), Chowdeck (food + discovery), and modern e‑commerce (product cards, CTAs).
- **Performance and clarity:** Smooth scrolling, clear hierarchy, and predictable taps (post → detail, product → PDP or add to cart).

---

## 2. Inspiration and patterns

### 2.1 Twitter / X

- **Tabs at top:** “For You” and “Following” (or “Discover”) with a clear selected state and optional underline.
- **Timeline:** Vertical list; each item is a card (avatar, name, handle, content, media, actions).
- **Takeaways:** Strong tab model for “For You” vs “Following”; compact header; consistent card height or content-driven height with images.

### 2.2 Reddit

- **Card-based feed:** Each post is a card (community name, title, body, media, upvotes, comments).
- **Mixed content:** Text, image, video, link; one component can handle multiple media types.
- **Takeaways:** Community/niche label on each post; clear primary action (open thread); secondary actions (vote, comment, share).

### 2.3 Chowdeck (food delivery / discovery)

- **Discovery-first:** Categories, “trending,” and personalized picks in one experience.
- **Product + context:** Product cards with image, name, price, restaurant; sometimes short “story” or post above.
- **Takeaways:** Strong imagery; price and CTA on product cards; optional “story” or post strip for engagement.

### 2.4 Modern e‑commerce (Amazon, Jumia, etc.)

- **Product cards:** Image, title, price, rating, optional “Add to cart” or “View.”
- **Grid vs list:** List for feed (like social), grid for “Shop” or category views.
- **Takeaways:** Price prominence; trust (ratings, reviews count); one primary CTA per card.

---

## 3. Recommended home layout (high level)

- **Top:** App bar with logo, global **search** (navigates to search screen using the **global search API**), and optional icons (notifications, cart).
- **Tabs:** Horizontal scrollable tabs: **For You** (default), **Discover**, **Trending**, **Following**. Optional: **Niche** tabs (e.g. “Tech”, “Fashion”) that call the niche feed endpoint.
- **Feed:** Single vertical list (e.g. `FlatList`). Each item is either:
  - **Post card:** Author (avatar, name, niche badge), caption, media (image/video), likes/comments, “View post” / tap to open detail.
  - **Product card:** Image, name, price, seller, rating, “View” or “Add to cart” (or both).
- **Bottom nav:** Keep existing (Home, Search, Cart, Profile, etc.).

---

## 4. Post card (social)

**Purpose:** Feel like a social post (Twitter/Reddit), not an ad.

- **Header:** Avatar + username (tappable → profile). Optional: small niche label (e.g. “r/Fashion”) from `item.niche.name` or `item.niche.slug`.
- **Body:** Caption (truncate with “more” if long). Below: media (image or video; respect `aspect_ratio` for layout).
- **Footer:** Likes count, comments count; optional: share, save. Primary action: tap card → post detail.
- **Layout:** Full width; media can be full width or max height (e.g. 320) to keep scroll smooth. Use consistent padding (e.g. 12–16) and subtle separators or spacing between cards.

**Data from API:** `item.type === 'post'`; use `user`, `caption`, `media`, `likes_count`, `comments_count`, `niche`, `created_at`.

---

## 5. Product card (commerce)

**Purpose:** Clear “this is buyable” with price and CTA.

- **Image:** Primary image (first in `images`); aspect ratio e.g. 1:1 or 4:5; placeholder if no image.
- **Info:** Name (1–2 lines), price (prominent), optional rating + reviews count.
- **Seller:** Small line: “By {shop_name}” or seller avatar + name (from `seller.user`).
- **CTA:** “View” (→ product detail) or “Add to cart” (if your flow supports it). One primary button per card.

**Data from API:** `item.type === 'product'`; use `name`, `description`, `price`, `seller`, `images`, `rating`, `reviews_count`.

---

## 6. UX principles

- **Differentiate without fragmenting:** Posts and products look different (card layout, presence of price, CTA) but live in the same list so the experience feels unified.
- **One primary action per card:** Post → open post; Product → open product or add to cart. Avoid multiple competing buttons.
- **Respect loading and empty states:** Skeleton for feed items; “Pull to refresh”; empty state per tab (“No posts yet” / “Follow sellers to see their products”).
- **Tabs and deep links:** Tab state (For You / Discover / etc.) should be restorable (e.g. via URL or navigation state) so “Home” always opens the last used tab.
- **Search:** Expose global search prominently (icon or bar in header). Search screen uses the **global search endpoint** and shows products, posts, and sellers in sections or tabs.

---

## 7. Accessibility and polish

- **Touch targets:** Minimum 44pt for buttons and tappable areas.
- **Labels:** Screen reader labels for “Post by …”, “Product …”, “Open post”, “View product”.
- **Contrast:** Text on background and on images (with overlay if needed) meets contrast guidelines.
- **Images:** Use `alt_text` when available; placeholder for failed loads.

---

## 8. Summary: what to build

| Area | Recommendation |
|------|-----------------|
| **Data** | Single feed API per tab (For You, Discover, Trending, Following, Niche). No separate product/post lists for main feed. |
| **Tabs** | For You, Discover, Trending, Following (+ optional Niche). |
| **List** | One `FlatList` (or equivalent); `item.type` drives Post card vs Product card. |
| **Post card** | Author, caption, media, engagement, niche badge; tap → post detail. |
| **Product card** | Image, name, price, seller, rating; tap → product detail (or cart). |
| **Search** | Global search in header/screen; use global search API; show products, posts, sellers. |

This keeps the home page modern, consistent, and aligned with the backend feed and search APIs while giving posts and products distinct, expert-level UX.
