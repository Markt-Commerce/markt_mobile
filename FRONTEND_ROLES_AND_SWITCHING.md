# Frontend: Buyer/Seller Roles and Role Switching

This doc is for frontend (React Native, web, etc.) implementers. It explains how a user can have **two account types** (buyer and/or seller), how **current role** works, how to **switch roles**, and how to handle **401 vs 403** so you don’t redirect to login when the user just needs to switch role.

---

## 1. One user, two account types

- A **user** (one email, one password) can have:
  - **Buyer account only** (`is_buyer: true`, no seller profile)
  - **Seller account only** (`is_seller: true`, no buyer profile)
  - **Both** (`is_buyer: true`, `is_seller: true`)

- **Registration** creates one role: the user chooses `account_type: "buyer"` or `"seller"` and gets that account. The backend sets `current_role` to that type.

- **Adding the other role later:** A user who only has buyer can add a seller account; one who only has seller can add a buyer account. There is no “second login”—same session, new profile.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/users/register` | Create user with one `account_type`: `"buyer"` or `"seller"`. |
| `POST /api/v1/users/create-buyer` | Add a **buyer** account to an existing user (e.g. current only-seller). Requires login. Body: e.g. `{ "buyername", "shipping_address" }`. |
| `POST /api/v1/users/create-seller` | Add a **seller** account to an existing user (e.g. current only-buyer). Requires login. Body: e.g. `{ "shop_name", "description", "category_ids", "policies" }`. |

- After creating the second account, the user has **both** roles. The backend keeps **one active role** at a time: `current_role` is either `"buyer"` or `"seller"`. That’s what is used for role-gated endpoints (e.g. seller-only APIs).

---

## 2. Current role and login

- **`current_role`** is stored server-side (and cached in Redis). It is returned in login and profile responses so the frontend can show the right UI (e.g. “Shopping” vs “My shop”).

- **Login** can optionally set which role to use:
  - **With** `account_type`: `POST /api/v1/users/login` with `{ "email", "password", "account_type": "buyer" }` or `"seller"`. Backend sets `current_role` to that and returns user (including `current_role`).
  - **Without** `account_type`: backend uses stored `current_role`; if the user has both accounts and none is stored, it typically defaults to `"buyer"`.

- **Profile** includes role and accounts:
  - `GET /api/v1/users/profile` returns the full profile, including:
    - `current_role`: `"buyer"` or `"seller"`
    - `is_buyer`, `is_seller`: booleans
    - `buyer_account`, `seller_account`: present only if that account exists (and may be `null` if not).

Use `current_role` plus `is_buyer` / `is_seller` to decide what to show (e.g. “Switch to seller” only when `is_seller === true`).

---

## 3. Switching role (when user has both)

- **Endpoint:** `POST /api/v1/users/switch-role`
- **Auth:** Required (logged-in user).
- **When it’s allowed:** User must have **both** buyer and seller accounts. If they only have one role, the backend returns an error (e.g. 400) and you should not show a “Switch role” control for that user.

**Response (200):**

```json
{
  "success": true,
  "previous_role": "buyer",
  "current_role": "seller",
  "message": "Successfully switched from buyer to seller"
}
```

Optional: backend may also include a `user` object with updated profile (e.g. `current_role`). Prefer using the `current_role` in the response for the next requests.

**What the frontend should do after a successful switch:**

1. Update local state: set “current role” to `response.current_role` so the UI (tabs, nav, CTAs) reflects seller vs buyer mode.
2. Optionally call `GET /api/v1/users/profile` to refresh full profile (e.g. seller_account details).
3. No need to log out or send credentials again; the session cookie is unchanged. Subsequent API calls will use the new role because the server stores `current_role` per session.

**UX suggestions:**

- Show a role switcher (e.g. “Buying” / “Selling” toggle or a “Switch to seller” button) only when `is_buyer && is_seller`.
- After switch, navigate to the appropriate home (e.g. buyer home vs seller dashboard) or refresh the current screen so data matches the new role.

---

## 4. 401 vs 403: when to redirect to login vs “switch role”

The backend uses two different responses. **Do not treat them the same.**

| Status | Meaning | Frontend action |
|--------|---------|------------------|
| **401 Unauthorized** | User is **not** logged in (no valid session / cookie missing or expired). | **Redirect to login.** Clear local “user” state and show the login screen. |
| **403 Forbidden** | User **is** logged in, but not allowed to do this action (wrong role, or resource ownership, or “active seller required”). | **Do not redirect to login.** Show an in-app message; for role-related 403s, offer “Switch to seller” (or buyer) if the user has that role. |

**Why this matters:** If you redirect to login on every 401 **and** 403, a user who is logged in as **buyer** and taps “Add product” (seller-only) would be sent to the login screen. That’s wrong: they’re already authenticated; they just need to **switch to seller** (or be told they don’t have a seller account).

**Backend behavior (summary):**

- Endpoints protected by `@login_required` only: no session → **401**.
- Endpoints protected by `@seller_required`: no session → **401**; session but not a seller or seller inactive → **403** (e.g. “Active seller account required”).
- Endpoints protected by `@buyer_required`: no session → **401**; session but not a buyer → **403** (e.g. “Only buyers can access this endpoint”).
- Ownership checks (e.g. “edit your own post”): logged in but not owner → **403**.

So: **401 = “please log in”**, **403 = “you’re logged in but not allowed; maybe switch role or request access”.**

**Suggested frontend logic:**

1. **On 401:** Clear session/user, redirect to login. Optional: toast “Session expired” or “Please log in again”.
2. **On 403:** Do **not** clear session or redirect to login. Read `response.body.message` (or equivalent).  
   - If it’s about seller/buyer role (e.g. “Active seller account required”, “Only sellers can access this endpoint”):  
     - If user has the other role (`is_seller` / `is_buyer`), show: “This action requires seller mode. Switch to seller?” with a button that calls `POST /api/v1/users/switch-role` and then retries or navigates.  
     - If user doesn’t have that role, show: “Create a seller account” (or buyer) and link to create-account flow.  
   - For other 403s (e.g. “You can only edit your own posts”), show a generic “You don’t have permission” message.

This keeps “redirect to login” only for real auth failures (401) and uses 403 for permission/role issues so the user can fix them without re-logging in.

---

## 5. API quick reference

| Action | Method | Endpoint | Body / notes |
|--------|--------|----------|--------------|
| Register (one role) | POST | `/api/v1/users/register` | `account_type`: `"buyer"` or `"seller"` (+ buyer_data or seller_data). |
| Login (optional role) | POST | `/api/v1/users/login` | `email`, `password`, optional `account_type`: `"buyer"` or `"seller"`. |
| Get profile | GET | `/api/v1/users/profile` | Returns `current_role`, `is_buyer`, `is_seller`, `buyer_account`, `seller_account`. |
| Switch role | POST | `/api/v1/users/switch-role` | No body. User must have both accounts. Returns `previous_role`, `current_role`, `message`. |
| Add buyer account | POST | `/api/v1/users/create-buyer` | `buyername`, optional `shipping_address`. |
| Add seller account | POST | `/api/v1/users/create-seller` | `shop_name`, `description`, optional `category_ids`, `policies`. |

All of these (except register/login) require the session cookie. Use the same HTTP client with credentials (e.g. `withCredentials: true` / `credentials: 'include'`) as in the main auth guide.

---

## 6. Summary

- A user can have **buyer only**, **seller only**, or **both**. They can add the second account later via create-buyer / create-seller.
- **Current role** (`current_role`) is stored server-side and returned in login and profile. Use it to show buyer vs seller UI.
- **Switch role** is `POST /api/v1/users/switch-role`; only for users with both accounts. After success, update local state and optionally refresh profile.
- **401** = not logged in → redirect to login. **403** = logged in but not allowed (e.g. wrong role) → do not redirect to login; show message and/or “Switch to seller/buyer” or “Create seller/buyer account”.

Following this keeps role switching and permission errors consistent with the backend and avoids confusing “redirect to login” when the user only needs to switch role.
