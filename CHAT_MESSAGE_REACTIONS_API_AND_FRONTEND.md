# Chat Message Reactions — API Contract & Frontend Instructions

This document provides the **API contract** for chat message reactions (emoji reactions on messages in chat rooms) and **frontend implementation instructions** for React Native / web.

**Base URL:** `{API_BASE}/api/v1`. **Auth:** Session cookie required for POST and DELETE; GET works without auth for public display, but `has_reacted` will be false when not logged in.

---

## Part 1: API Contract

### 1.1 Overview

Users can add emoji reactions to chat messages. Each message supports multiple reaction types; each user can have one reaction per type per message. The API uses **reaction type** as a string (e.g. `"HEART"`), mapped to emoji for display.

**Allowed reaction types:**

| Type       | Emoji | Display |
|------------|-------|---------|
| `THUMBS_UP`  | 👍 | Like/approve |
| `THUMBS_DOWN`| 👎 | Dislike/disapprove |
| `HEART`      | ❤️ | Love/favorite |
| `FIRE`       | 🔥 | Hot/trending |
| `STAR`       | ⭐ | Quality/rating |
| `MONEY`      | 💰 | Good deal/value |
| `SHOPPING`   | 🛒 | Want to buy |
| `CHECK`      | ✅ | Verified/confirmed |
| `EYES`       | 👀 | Interesting/watching |
| `CLAP`       | 👏 | Appreciation |
| `ROCKET`     | 🚀 | Amazing/awesome |
| `SMILE`      | 😊 | Happy/satisfied |

---

### 1.2 List reactions for a message

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chats/messages/<message_id>/reactions` | GET | Get all reactions for a message with counts and `has_reacted` |

**Path:** `message_id` — integer (e.g. `471113`).

**Auth:** Optional. When authenticated, `has_reacted` is true for types the current user has added. When not logged in, `has_reacted` is always false.

**Response (200):**

```json
[
  {
    "reaction_type": "HEART",
    "emoji": "❤️",
    "count": 3,
    "has_reacted": true
  },
  {
    "reaction_type": "THUMBS_UP",
    "emoji": "👍",
    "count": 1,
    "has_reacted": false
  }
]
```

- **reaction_type** — String key (use with add/remove endpoints).
- **emoji** — Emoji for display (or map client-side from `reaction_type`).
- **count** — Number of users who added this reaction.
- **has_reacted** — Whether the current user has this reaction on this message.

---

### 1.3 Add reaction

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chats/messages/<message_id>/reactions` | POST | Add a reaction to a message |

**Path:** `message_id` — integer.

**Auth:** Required.

**Body (JSON):**

```json
{
  "reaction_type": "HEART"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `reaction_type` | string | yes | One of the allowed types (e.g. `HEART`, `THUMBS_UP`, `FIRE`, `STAR`, etc.) |

**Response (201):** Reaction object (id, message_id, user_id, reaction_type, created_at). Body may be minimal; frontend should refetch or use socket event to update UI.

**Errors:**
- **400** — Invalid `reaction_type` or other validation error.
- **404** — Message not found.
- **401** — Not authenticated.

**Idempotency:** If the user already has this reaction on the message, the endpoint returns the existing reaction (200/201).

---

### 1.4 Remove reaction

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chats/messages/<message_id>/reactions/<reaction_type>` | DELETE | Remove a reaction from a message |

**Path:**
- `message_id` — integer.
- `reaction_type` — string (e.g. `HEART`).

**Auth:** Required.

**Response (204):** No body.

**Errors:**
- **404** — Reaction not found (user hasn’t added this reaction, or message invalid).
- **401** — Not authenticated.

---

## Part 2: Socket.IO (Real-time updates)

Chat namespace: `/chat`. All events require `user_id` in the payload.

### 2.1 Join message room (for reaction updates)

To receive real-time reaction events for a message, join the message room:

**Emit:** `join_message`  
**Payload:** `{ "message_id": 471113, "user_id": "USR_xxx" }`

**Server emit:** `message_reaction_stats` — `{ "message_id", "reactions": { "HEART": 3, "THUMBS_UP": 1 }, "timestamp" }` (from Redis cache; may be partial).

### 2.2 Reaction events (server → client)

**Event:** `message_reaction_added`  
**Payload:**
```json
{
  "message_id": 471113,
  "user_id": "USR_xxx",
  "username": "johndoe",
  "reaction_type": "HEART",
  "timestamp": "2025-02-26T22:17:36.000Z"
}
```

**Event:** `message_reaction_removed`  
**Payload:** Same shape (message_id, user_id, reaction_type, timestamp).

When you receive these events, update the reaction counts and `has_reacted` state for the message. You can also emit these via socket (if backend supports client-side emit for reactions); otherwise use REST only.

---

## Part 3: Frontend Instructions

### 3.1 UI pattern

1. **Inline reactions** — Show existing reactions below or beside each message (emoji + count).
2. **Reaction picker** — Long-press or tap a reaction icon to open a horizontal row of emoji; user selects one.
3. **Toggle** — If user has already reacted with that type, tapping again removes the reaction.

### 3.2 REST flow

**Initial load (message list):**
- Option A: Messages include `reactions` summary (if your message list API returns it).
- Option B: Call `GET /chats/messages/<id>/reactions` per visible message (or batch if supported). Prefer caching per message.

**Add reaction:**
1. User selects emoji (e.g. HEART).
2. `POST /chats/messages/<message_id>/reactions` with `{ "reaction_type": "HEART" }`.
3. On success: update local state (increment count, set `has_reacted` true) or refetch reactions.

**Remove reaction:**
1. User taps their existing reaction.
2. `DELETE /chats/messages/<message_id>/reactions/HEART`.
3. On success: decrement count, set `has_reacted` false.

### 3.3 Real-time (optional)

1. When entering a chat screen, join `room_{room_id}` (existing flow).
2. For each visible message, emit `join_message` with `{ message_id, user_id }` to receive reaction events.
3. Listen for `message_reaction_added` and `message_reaction_removed`; update reaction counts for the given `message_id`.

### 3.4 Reaction picker UI

- Show 4–6 common reactions (e.g. HEART, THUMBS_UP, FIRE, STAR, CLAP, ROCKET) in a horizontal row.
- Use emoji from the table above; map `reaction_type` → emoji client-side for consistency.
- Optional: “View all” to show full set of 12 types.

### 3.5 Display rules

- **Count > 0:** Show emoji + count (e.g. `❤️ 3`).
- **has_reacted:** Highlight (e.g. filled/bordered) the user’s reaction.
- **Toggle:** Tap on user’s reaction → remove; tap on other or empty → add (open picker if multiple options).

### 3.6 Error handling

- **400:** Invalid `reaction_type` — show “Invalid reaction” and don’t update UI.
- **404:** Message not found — remove message from UI or show error.
- **401:** Redirect to login.

### 3.7 TypeScript types

```ts
const REACTION_EMOJIS: Record<string, string> = {
  THUMBS_UP: "👍",
  THUMBS_DOWN: "👎",
  HEART: "❤️",
  FIRE: "🔥",
  STAR: "⭐",
  MONEY: "💰",
  SHOPPING: "🛒",
  CHECK: "✅",
  EYES: "👀",
  CLAP: "👏",
  ROCKET: "🚀",
  SMILE: "😊",
};

type ReactionType = keyof typeof REACTION_EMOJIS;

interface ReactionSummary {
  reaction_type: ReactionType;
  emoji: string;
  count: number;
  has_reacted: boolean;
}

// Add: POST /chats/messages/:messageId/reactions  Body: { reaction_type }
// Remove: DELETE /chats/messages/:messageId/reactions/:reactionType
// List: GET /chats/messages/:messageId/reactions
```

---

## Part 4: Quick reference

| Action | Method | Path |
|--------|--------|------|
| List reactions | GET | `/chats/messages/<message_id>/reactions` |
| Add reaction | POST | `/chats/messages/<message_id>/reactions` |
| Remove reaction | DELETE | `/chats/messages/<message_id>/reactions/<reaction_type>` |

**Socket (namespace `/chat`):**
- Join: `emit('join_message', { message_id, user_id })`
- Listen: `message_reaction_added`, `message_reaction_removed`
