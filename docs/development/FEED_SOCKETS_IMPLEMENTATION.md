# Feed & Social WebSockets — Implementation Guide

Per **FEED_ACTIONS_PRODUCTS_POSTS_AND_WEBSOCKETS.md** §4, real-time updates for the feed use the **`/social`** namespace. This doc describes what to implement and how it aligns with the existing **`/chat`** implementation.

## Current state

| Namespace | Purpose | Status |
|-----------|---------|--------|
| **`/chat`** | Messages, typing, offers, reactions | **Implemented** in `services/chatSock.ts` (join_room, leave_room, message, typing_start/stop, send_offer, respond_to_offer). |
| **`/social`** | Post likes, comment reactions, reviews | **Stub only** — connect and event hooks ready; backend events (e.g. from `REALTIME_SOCKET_EVENTS.md`) to be wired when available. |
| **`/orders`** | Order status, payment | Not implemented. |
| **`/notification`** | General notifications | Not implemented. |

## Socket auth (all namespaces)

- **No session on socket.** Every emit must include **`user_id`** (current user id). Server validates per event. See `SOCKET_AUTH_ARCHITECTURE_UPDATES.md` (if present in your backend repo).

## `/social` namespace — events to support

When the backend exposes these (see your backend’s `REALTIME_SOCKET_EVENTS.md` or equivalent), wire them in `services/socialSock.ts`:

| Client emit | Payload | Use case |
|-------------|---------|----------|
| `join_post` | `{ post_id, user_id }` | User opens post detail → join to receive live like/comment updates. |
| `join_product` | `{ product_id, user_id }` | User opens product detail → join for review/availability updates. |

| Server emit | Payload (typical) | Frontend action |
|-------------|-------------------|-----------------|
| `post_liked` | `{ post_id, user_id, like_count }` | Update like count and “liked” state on post detail and in feed if visible. |
| `post_unliked` | `{ post_id, user_id, like_count }` | Same. |
| `comment_reaction_added` | `{ comment_id, reaction_type, user_id, count }` | Update comment reactions on post detail. |
| `comment_reaction_removed` | similar | Same. |
| `review_added` | `{ product_id, review_id }` | Refresh product reviews or count. |

## Where to use `/social` in the app

1. **Post detail screen** — On mount: `socialSocket.joinPost(postId, userId)`. Listen for `post_liked` / `post_unliked` for that `post_id` and update local state (like count, isLiked).
2. **Post detail comments** — Listen for `comment_reaction_added` / `comment_reaction_removed` and update the comment’s reaction summary.
3. **Product detail screen** — On mount: `socialSocket.joinProduct(productId, userId)`. Listen for `review_added` and refetch or append reviews.
4. **Feed list** — Optional: if the same post/product is visible in the feed when an event fires, update that item’s like count or reaction count (by id).

## Stub: `services/socialSock.ts`

A minimal stub is provided so that:

- Post/product detail screens can call `socialSocket.joinPost(id, userId)` / `joinProduct(id, userId)` without errors.
- You can subscribe to `onPostLiked`, `onCommentReaction`, etc.; when the backend sends events, add the actual `io('/social')` connection and emit/listen logic.

When the backend `/social` namespace is live, replace the stub’s no-op `connect()` with a real `io(SOCIAL_URL)` and the event names/payloads from your backend doc.
