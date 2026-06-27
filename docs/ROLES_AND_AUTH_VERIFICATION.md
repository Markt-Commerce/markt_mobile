# Roles, Auth & 401/403 Verification

**References:** `REACT_NATIVE_AUTH_GUIDE.md`, `FRONTEND_ROLES_AND_SWITCHING.md`

**Goal:** Self-sufficient understanding of user modes and error handling so the app (and you) can evolve without constant AI guidance.

---

## 1. User Modes (from FRONTEND_ROLES_AND_SWITCHING.md)

A user can be in one of three account states:

| State | Meaning | UI implications |
|-------|---------|-----------------|
| **Buyer only** | `is_buyer: true`, no seller profile | Show buyer tabs; offer "Create seller account" |
| **Seller only** | `is_seller: true`, no buyer profile | Show seller dashboard; offer "Create buyer account" |
| **Both** | `is_buyer` and `is_seller` | Show role switcher; allow `POST /users/switch-role` |

**Current role** (`current_role`) — server-side, either `"buyer"` or `"seller"`. Use it for role-gated UI (e.g. seller-only tabs, "Add product" visibility).

### Switching role

- **Endpoint:** `POST /api/v1/users/switch-role` (no body)
- **When:** Only when user has **both** accounts
- **After success:** Update local `role`; optionally refresh profile; no need to re-login

### Adding the other account

- **Buyer:** `POST /api/v1/users/create-buyer` with `buyername`, optional `shipping_address`
- **Seller:** `POST /api/v1/users/create-seller` with `shop_name`, `description`, etc.

---

## 2. 401 vs 403 (do not treat the same)

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| **401 Unauthorized** | Not logged in (session missing/expired) | Clear session, redirect to login |
| **403 Forbidden** | Logged in but not allowed (wrong role, ownership, etc.) | **Do not** redirect. Show in-app message; for role 403s, offer "Switch to seller" or "Create seller account" |

**Why:** Redirecting to login on 403 would be wrong — the user is authenticated; they may only need to switch role.

### Implementation (services/api.ts)

- **401:** Clears token + `user_session`, calls `onUnauthorized` → UserProvider clears user → AppStack shows login.
- **403:** Does **not** clear session or redirect. Throws error with `err.status === 403` so callers can branch.

### Caller handling for 403

```javascript
try {
  await createProduct(data);
} catch (e) {
  if ((e as any).status === 403) {
    // Role-related? Offer "Switch to seller" if is_seller, else "Create seller account"
    show({ variant: "info", title: "Switch mode", message: "This action requires seller mode." });
  } else {
    show({ variant: "error", message: e.message });
  }
}
```

---

## 3. Quick Reference

| Action | Endpoint | Notes |
|--------|----------|-------|
| Login (with role) | `POST /users/login` | Optional `account_type: "buyer"` or `"seller"` |
| Profile | `GET /users/profile` | Returns `current_role`, `is_buyer`, `is_seller` |
| Switch role | `POST /users/switch-role` | Requires both accounts |
| Create buyer | `POST /users/create-buyer` | Add buyer account to seller-only user |
| Create seller | `POST /users/create-seller` | Add seller account to buyer-only user |

---

## 4. Testing Checklist

- [ ] 401 → session cleared, redirect to login, no duplicate toasts
- [ ] 403 → no redirect; error surfaced to caller; can show "Switch to seller"
- [ ] Role switcher only visible when `is_buyer && is_seller`
- [ ] Switch role → local `role` updated; feed/tabs reflect new mode
