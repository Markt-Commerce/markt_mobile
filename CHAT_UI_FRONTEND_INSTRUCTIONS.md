# Chat UI: Product & Message Type Display — Frontend Instructions

Instructions for rendering chat messages correctly, including **product message cards** and other message types. The backend now **enriches product and offer messages with a product snapshot** (name, price, image) so the frontend can render product cards without extra API calls.

---

## 1. What the Backend Returns

### Message object shape (REST & Socket.IO)

```json
{
  "id": 123,
  "room_id": 456,
  "sender_id": "USR_xxx",
  "sender": { "id", "username", "profile_picture", "is_seller" },
  "content": "Sharing product PRD_xxx" | "Hello" | etc.,
  "message_type": "text" | "image" | "product" | "offer" | "discount" | "discount_response",
  "message_data": null | { ... },
  "is_read": true,
  "created_at": "2025-02-15T12:00:00"
}
```

### Product message (`message_type: "product"`)

The backend **enriches** product messages with a product snapshot in `message_data`:

```json
{
  "message_type": "product",
  "content": "Sharing product PRD_xxx",
  "message_data": {
    "product_id": "PRD_xxx",
    "product": {
      "id": "PRD_xxx",
      "name": "iPhone 14 Pro",
      "price": 800000,
      "currency": "NGN",
      "image_url": "https://..."
    }
  }
}
```

- **`message_data.product`** — Always present for new product messages. Contains `id`, `name`, `price`, `currency`, `image_url` (or `null` if no image).
- **Backward compatibility:** Older messages may have only `product_id` and no `product` snapshot. In that case, the backend still enriches on read when possible.

### Offer message (`message_type: "offer"`)

Offer messages include `offer` at the message level with a product snapshot:

```json
{
  "message_type": "offer",
  "content": "I can do ₦80,000 for this",
  "message_data": { ... },
  "offer": {
    "id": 1,
    "product_id": "PRD_xxx",
    "price": 80000,
    "status": "pending",
    "product": {
      "id": "PRD_xxx",
      "name": "iPhone 14 Pro",
      "price": 800000,
      "currency": "NGN",
      "image_url": "https://..."
    }
  }
}
```

---

## 2. Rendering by Message Type

### A. Product messages (`message_type === "product"`)

1. Use `message_data.product` when available.
2. Fallback to `message_data.product_id` and fetch product via `GET /api/v1/products/<product_id>` only if `product` is missing (legacy messages).

**Product card layout:**

| Element       | Required | Notes                                                |
|---------------|----------|------------------------------------------------------|
| Product image | Yes      | `product.image_url` or placeholder when null         |
| Product name  | Yes      | `product.name`, max 2 lines, ellipsis                |
| Price         | Yes      | Format with `product.currency` (e.g. ₦800,000)       |
| CTA           | Optional | "View product" linking to product detail             |

**Image fallback:**

- If `image_url` is `null` or fails to load, show a compact placeholder (icon + "Product") instead of "No image" or large blank areas.

**Product not found:**

- If enrichment returns no `product` and fetch fails (404), show a small card: "Product no longer available" with a neutral icon.

---

### B. Offer messages (`message_type === "offer"`)

- Use `offer.product` for the product card (same structure as above).
- Show the offer line: e.g. "Offered ₦80,000".
- Use `offer.status` (pending / accepted / rejected) for styling.

---

### C. Text messages (`message_type === "text"`)

- Standard bubble.
- Support line breaks.
- Optionally linkify URLs.

---

### D. Image messages (`message_type === "image"`)

- Image URL(s) may be in `message_data` (e.g. `image_url`, `thumbnail_url`).
- Render thumbnail in bubble; tap to open fullscreen.
- Fallback if URL fails: icon + "Image unavailable".

---

### E. Discount messages (`message_type === "discount"` | `discount_response`)

- Use `message_data` for discount details.
- Show a compact "Discount offer" / "Discount response" card with type, value, expiry, and status.

---

### F. Unknown or empty messages

- Do not render large blank bubbles.
- Use a compact fallback: small "Message" label with optional icon.
- Avoid showing raw IDs or empty boxes.

---

## 3. Implementation Checklist

- [ ] Render `message_type` in a switch/component map.
- [ ] For product messages: use `message_data.product` when present; no extra API call.
- [ ] For legacy product messages: fallback to `GET /api/v1/products/<product_id>` only if `product` is missing.
- [ ] Product card: image, name, price, optional CTA.
- [ ] Image fallback: icon + "Product" when `image_url` is null or fails.
- [ ] Product not found: "Product no longer available" card.
- [ ] For offers: use `offer.product` for the product card.
- [ ] Handle unknown/empty messages with a compact fallback.
- [ ] Never render large blank areas or raw product IDs as main content.

---

## 4. Design Guidelines

- **Product card:** Max width ~85% of bubble; aspect ratio 4:3 or 1:1 for image; rounded corners; light border or shadow.
- **Sender alignment:** Outgoing (right) vs incoming (left).
- **Colors:** Outgoing bubble in primary color; incoming in neutral.
- **Accessibility:** Alt text on images; tap targets ≥ 44px; sufficient contrast.

---

## 5. Inspirations

- **WhatsApp** — Product sharing bubbles, link previews.
- **Facebook Marketplace** — Product cards with image, title, price, CTA.
- **Instagram DMs** — Product share cards.
- **Carousell / OfferUp** — Marketplace chat product cards.

---

## 6. API Reference

| Endpoint                         | Purpose                               |
|----------------------------------|---------------------------------------|
| `GET /api/v1/chats/rooms/<id>/messages` | Paginated messages (includes product snapshot) |
| `POST /api/v1/chats/rooms/<id>/messages`| Send message (product snapshot stored automatically) |
| `GET /api/v1/products/<id>`      | Fallback for legacy product messages only |
