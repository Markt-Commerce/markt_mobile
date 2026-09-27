# Chats — API Contract and Sockets

This doc gives the **REST API contract** for chats (`/api/v1/chats`), the **Socket.IO contract** (chat namespace), and **what to do when the user taps “Chat” on a product**.

**Base URL (REST):** `{API_BASE}/api/v1`. **Chat namespace (sockets):** `{WS_BASE}/chat` (e.g. `http://your-api-domain.com/chat`). All socket events require **`user_id`** in the payload (no session on socket). See [SOCKET_AUTH_ARCHITECTURE_UPDATES.md](./development/SOCKET_AUTH_ARCHITECTURE_UPDATES.md).

---

## 1. When the user clicks “Chat” on a product

**Goal:** Open a 1:1 chat with the seller about that product (create room if needed, then open chat).

### 1.1 Data you need from the product

- **Product id:** `product.id` (e.g. `PRD_xxx`).
- **Seller’s user id:** From the product payload. Use **`product.seller.user.id`** (or `product.seller_user.id` if your API returns that). This is the **user** id (UUID string), not the seller account id. Required for creating the room.

If the product detail doesn’t include seller user id, use **`GET /api/v1/products/<product_id>`** and read `seller.user.id` or `seller_user.id` from the response.

### 1.2 Create or get chat room (REST)

**Endpoint:** `POST /api/v1/chats/rooms`

**Auth:** Required.

**Body (JSON):** Depends on **current role**.

- **Buyer (current user is buyer):**  
  Send the **seller’s user id** and optional **product id**:
  ```json
  {
    "seller_id": "USR_xxx",
    "product_id": "PRD_xxx"
  }
  ```
  - `seller_id` (required when buyer): the seller’s **user** id from the product.
  - `product_id` (optional): this product. Omit for a general buyer–seller room; include to scope the room to this product (recommended for “Chat about this product”).

- **Seller (current user is seller):**  
  Send the **buyer’s user id** (and optional product/request):
  ```json
  {
    "buyer_id": "USR_yyy",
    "product_id": "PRD_xxx"
  }
  ```

**Response (201):**

```json
{
  "id": 123,
  "buyer_id": "USR_buyer",
  "seller_id": "USR_seller",
  "product_id": "PRD_xxx",
  "request_id": null,
  "last_message_at": null,
  "unread_count_buyer": 0,
  "unread_count_seller": 0
}
```

### 1.3 What the frontend should do

1. On “Chat” tap (e.g. from product detail or product card):
   - Ensure you have **seller’s user id** and **product id** (from product detail or list).
2. **POST** `/chats/rooms` with `{ "seller_id": "<seller.user.id>", "product_id": "<product.id>" }` (as buyer). Use **current user id** and **seller’s user id**; backend will create or return the existing room for that buyer–seller–product.
3. From the response, take **`id`** (room_id). Navigate to the **chat screen** for that room (e.g. `/chat/:roomId`).
4. On the chat screen:
   - **Join the socket room** (see §3): `emit('join_room', { room_id: roomId, user_id: currentUserId })`.
   - **Load messages** via **GET** `/chats/rooms/<room_id>/messages?page=1&per_page=50`.
   - Optionally **mark as read**: **POST** `/chats/rooms/<room_id>/read`.
5. Show the thread; send messages via REST (**POST** messages) or socket (**emit('message', ...)**) per your app’s choice (see §2 and §3).

**Summary:** “Chat” on product → resolve seller **user** id + product id → **POST /chats/rooms** → open chat screen with returned **room_id** → join socket room and load messages.

---

## 2. REST API contract

All under **`/api/v1/chats`**. Auth: session cookie (login required unless noted).

### 2.1 List my chat rooms

**GET** `/api/v1/chats/rooms?page=1&per_page=20`

**Response (200):**

```json
{
  "rooms": [
    {
      "id": 123,
      "other_user": {
        "id": "USR_xxx",
        "username": "seller_name",
        "profile_picture": "url",
        "is_seller": true
      },
      "product": {
        "id": "PRD_xxx",
        "name": "Product name",
        "price": 99.99,
        "image": "url"
      },
      "request": null,
      "last_message": {
        "id": 456,
        "sender_id": "USR_yyy",
        "content": "Hello",
        "message_type": "text",
        "created_at": "2025-02-15T12:00:00"
      },
      "unread_count": 2,
      "last_message_at": "2025-02-15T12:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5
  }
}
```

---

### 2.2 Create or get chat room

**POST** `/api/v1/chats/rooms`

**Body:** See §1.2.  
- Buyer: `seller_id` (required), `product_id`, `request_id` (optional).  
- Seller: `buyer_id` (required), `product_id`, `request_id` (optional).

**Response (201):** Room object with `id`, `buyer_id`, `seller_id`, `product_id`, `request_id`, `last_message_at`, `unread_count_buyer`, `unread_count_seller`.

---

### 2.3 Get messages in a room

**GET** `/api/v1/chats/rooms/<room_id>/messages?page=1&per_page=50`

**Response (200):**

```json
{
  "messages": [
    {
      "id": 1,
      "room_id": 123,
      "sender_id": "USR_xxx",
      "sender": {
        "id": "USR_xxx",
        "username": "john",
        "profile_picture": "url",
        "is_seller": true
      },
      "content": "Is this still available?",
      "message_type": "text",
      "message_data": null,
      "is_read": true,
      "read_at": "2025-02-15T12:01:00",
      "created_at": "2025-02-15T12:00:00"
    },
    {
      "id": 2,
      "message_type": "offer",
      "content": "I can offer ₦80,000",
      "message_data": { ... },
      "offer": {
        "id": 1,
        "product_id": "PRD_xxx",
        "price": 80000,
        "status": "pending"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 42
  }
}
```

**Note:** Caller must be buyer or seller of the room (403 otherwise). Messages are typically returned in chronological order; backend may order by `created_at desc` and frontend reverses for display.

---

### 2.4 Send a text (or product) message

**POST** `/api/v1/chats/rooms/<room_id>/messages`

**Body:**

```json
{
  "content": "Is this still available?",
  "message_type": "text",
  "message_data": null
}
```

- **content** (required): string, 1–1000 chars.
- **message_type:** `text` | `image` | `product` | `offer` (default `text`).
- **message_data:** optional object (e.g. `{ "product_id": "PRD_xxx" }` for a product card).

**Response (201):** Message object (id, room_id, sender_id, content, message_type, message_data, is_read, created_at).

**Product messages:** The backend enriches `message_data` with a product snapshot (`product_id`, `product`: `{ id, name, price, currency, image_url }`) so the frontend can render product cards without an extra API call. See [CHAT_UI_FRONTEND_INSTRUCTIONS.md](./CHAT_UI_FRONTEND_INSTRUCTIONS.md).

---

### 2.5 Send an offer (seller price offer in chat)

**POST** `/api/v1/chats/rooms/<room_id>/offers`

**Body:**

```json
{
  "product_id": "PRD_xxx",
  "price": 80000,
  "message": "I can do ₦80,000 for this"
}
```

**Response (201):** Message object with `message_type: "offer"` and offer data.

---

### 2.6 Mark room as read

**POST** `/api/v1/chats/rooms/<room_id>/read`

**Response (200):** `{ "message": "Messages marked as read" }`.

---

### 2.7 Message reactions

- **GET** `/api/v1/chats/messages/<message_id>/reactions` — list reactions (summary per type, counts, has_reacted).
- **POST** `/api/v1/chats/messages/<message_id>/reactions` — add reaction. Body: `{ "reaction_type": "heart" }` (type must be one of backend’s allowed, e.g. from REACTION_EMOJIS).
- **DELETE** `/api/v1/chats/messages/<message_id>/reactions/<reaction_type>` — remove reaction. **Response (204).**

---

### 2.8 Discounts (in-chat offers from seller)

- **GET** `/api/v1/chats/rooms/<room_id>/discounts` — list active discount offers for the room.
- **POST** `/api/v1/chats/rooms/<room_id>/discounts` — create discount (seller). Body: discount_type, discount_value, minimum_order_amount, expires_at, usage_limit, product_id, discount_message, etc.
- **POST** `/api/v1/chats/discounts/<discount_id>/respond` — buyer respond. Body: `{ "response": "accepted" | "rejected", "response_message": "..." }`.
- **POST** `/api/v1/chats/discounts/<discount_id>/apply` — validate/apply discount. Body: `{ "order_amount": 99.99 }`.
- **POST** `/api/v1/chats/discounts/<discount_id>/cancel` — seller cancel.
- **GET** `/api/v1/chats/discounts/my-active` — my active discounts.

---

## 3. Socket.IO — Chat namespace

**Namespace:** `/chat`  
**Connect:** e.g. `const chatSocket = io('http://your-api-domain.com/chat')`.  
**Auth:** Every emit must include **`user_id`** (current user’s id). Server validates room access per event.

### 3.1 Connection

- **Event:** `connect`  
- **Server emit:** `connected` — `{ "status": "connected", "message": "..." }`.
- **Event:** `disconnect`

---

### 3.2 Room

- **Emit:** `join_room`  
  **Payload:** `{ "room_id": 123, "user_id": "USR_xxx" }`  
  **Server:** Joins client to `room_{room_id}`.  
  **Server emit:** `room_joined` — `{ "room_id", "room_data", "timestamp" }` (room_data includes other_user, product, request, messages).  
  **Server emit (error):** `error` — `{ "message": "..." }` (e.g. access denied).

- **Emit:** `leave_room`  
  **Payload:** `{ "room_id": 123, "user_id": "USR_xxx" }`  
  **Server emit:** `room_left` — `{ "room_id", "timestamp" }`.

---

### 3.3 Messages

- **Emit:** `message`  
  **Payload:** `{ "room_id": 123, "message": "Hello", "message_type": "text", "product_id": null, "user_id": "USR_xxx" }`  
  - **message** (required), **room_id**, **user_id** (required).  
  - **message_type:** text | image | product | offer.  
  - **product_id:** optional; for attaching a product to the message.  

  **Server:** Persists via ChatService, then:  
  - Emit **`message`** to all in `room_{room_id}` except sender (payload: message object with id, room_id, sender_id, sender_username, content, message_type, message_data, is_read, created_at).  
  - Emit **`message_sent`** to sender — `{ "message_id", "timestamp" }`.  
  **Server emit (error):** `error` — `{ "message": "..." }`.

**Rate limit:** ~30 messages per minute per user.

---

### 3.4 Typing

- **Emit:** `typing_start`  
  **Payload:** `{ "room_id": 123, "user_id": "USR_xxx", "username": "optional" }`  
  **Server emit:** `typing_update` to others in room — `{ "room_id", "user_id", "username", "action": "start", "timestamp" }`.

- **Emit:** `typing_stop`  
  **Payload:** `{ "room_id": 123, "user_id": "USR_xxx" }`  
  **Server emit:** `typing_update` — `{ "action": "stop", ... }`.

**Rate limit:** ~10 per minute per user.

---

### 3.5 Offers (over socket)

- **Emit:** `send_offer`  
  **Payload:** `{ "room_id": 123, "product_id": "PRD_xxx", "offer_amount": 25000, "message": "Optional text", "user_id": "USR_xxx" }`  
  **Server:** Creates offer via ChatService.  
  **Server emit (to room):** `offer_sent` — offer payload.  
  **Server emit (to sender):** `offer_confirmed` — `{ "offer_id", "timestamp" }`.

- **Emit:** `respond_to_offer`  
  **Payload:** `{ "offer_id": 1, "response": "accept" | "reject", "message": "Optional", "user_id": "USR_xxx" }`  
  **Server emit (to room):** `offer_response` — response data.

---

### 3.6 Ping / presence

- **Emit:** `ping`  
  **Payload:** `{ "user_id": "USR_xxx" }`  
  **Server:** Marks user online (presence).  
  **Server emit:** `pong` — `{ "timestamp", "user_id" }`.

---

### 3.7 Message reactions (real-time)

- **Emit:** `message_reaction_added`  
  **Payload:** `{ "message_id": 456, "reaction_type": "heart", "user_id": "USR_xxx", "username": "optional" }`  
  **Server emit:** `message_reaction_added` to room `message_{message_id}` — `{ "message_id", "user_id", "username", "reaction_type", "timestamp" }`.

- **Emit:** `message_reaction_removed`  
  **Payload:** `{ "message_id": 456, "reaction_type": "heart", "user_id": "USR_xxx" }`  
  **Server emit:** `message_reaction_removed` — same shape.

---

### 3.8 Discounts (over socket)

- **Emit:** `discount_offer` — create discount (seller). Payload includes room_id, discount fields, user_id.
- **Emit:** `discount_response` — buyer respond (accept/reject). Payload: discount_id, response, user_id.
- **Emit:** `get_discounts` — get active discounts for room. Payload: room_id, user_id. Server emits back discount list.

(Exact payloads follow the socket handlers in `app/chats/sockets.py`; include all required fields and `user_id`.)

---

## 4. Suggested flow: open chat from product

1. **Product screen:** Show “Chat” / “Message seller” using `product.seller.user.id` and `product.id`.
2. **On tap:**  
   `POST /chats/rooms` with `{ "seller_id": product.seller.user.id, "product_id": product.id }` (as buyer).
3. **Response:** `room_id` (e.g. `id: 123`). Navigate to chat screen for that room.
4. **Chat screen mount:**  
   - Connect to `/chat` if not already.  
   - `emit('join_room', { room_id: room_id, user_id: current_user.id })`.  
   - On `room_joined`, optionally use `room_data.messages` or ignore and use REST.  
   - `GET /chats/rooms/<room_id>/messages?page=1&per_page=50` to load history.  
   - `POST /chats/rooms/<room_id>/read` to mark read.
5. **Sending:** Use **POST** `/chats/rooms/<room_id>/messages` for text/product messages, or **emit('message', { room_id, message, message_type, product_id, user_id })**. Listen for **`message`** and **`message_sent`** to update UI.
6. **Leaving:** On leaving chat screen, `emit('leave_room', { room_id, user_id })`.

---

## 5. IDs summary

- **buyer_id / seller_id** in rooms and create-room body are **user ids** (UUID), not buyer/seller account ids.
- **room_id** is integer.
- **product_id** is string (e.g. `PRD_xxx`). Use it when creating a product-scoped room and when sending product/offer messages.

For “Chat” on a product, always pass the **seller’s user id** (from `product.seller.user.id`) and **product_id** so the room is tied to that product and the correct conversation is reused.
