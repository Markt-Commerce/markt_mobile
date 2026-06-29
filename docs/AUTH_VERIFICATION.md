# Auth Verification vs REACT_NATIVE_AUTH_GUIDE.md

**Goal:** Restore independent, high-fidelity thinking.  
**Outcome:** Model obsolescence via user self-sufficiency — clear, maintainable auth so the app (and you) can evolve without constant AI guidance.

---

## Verification Summary

| Guide Requirement | Status | Implementation |
|-------------------|--------|----------------|
| `credentials: 'include'` (Fetch) | ✅ | `services/api.ts` |
| Store `user_session` (user + timestamp) on login/register | ✅ | `authStorage.setUserSession`, called from `loginUser` / `registerUser` |
| Clear `user_session` on logout | ✅ | `authStorage.clearUserSession` in `logoutUser` |
| Clear `user_session` on 401 | ✅ | `api.ts` + `clearUserSession` |
| 401 → redirect to login | ✅ | `setOnUnauthorized` callback clears user in context; AppStack re-renders to intro/login |
| 403 → do NOT redirect | ✅ | `api.ts` only clears session on 401; 403 throws with `err.status = 403` for caller handling |
| `checkAuthStatus` on app start | ✅ | `UserProvider` runs `checkAuthStatus` in `useEffect` |
| `isLoggedIn` / `getStoredUser` | ✅ | `authStorage.isLoggedIn`, `authStorage.getStoredUser` |
| 7-day session expiry | ✅ | `SESSION_MAX_AGE_MS` in `authStorage` |
| Loading state during restore | ✅ | `isRestoringSession` + loading screen in `AppStack` |
| Bearer token fallback | ✅ | When backend supports it; cookies may not persist in RN |

---

## Architecture (Self-Sufficient Reference)

### 1. Storage (`services/authStorage.ts`)

- **user_session** — `{ user, role, timestamp }` for app restart. 7-day expiry.
- **auth_token** — Bearer token if backend returns one (cookie fallback when RN doesn’t persist cookies).

### 2. API (`services/api.ts`)

- `credentials: 'include'` for cookie auth.
- Adds `Authorization: Bearer <token>` when token exists.
- On 401: clears token, clears user_session, calls `onUnauthorized` → context clears user → AppStack shows login.

### 3. Auth Service (`services/sections/auth.ts`)

- `loginUser` / `registerUser` → persist `user_session` via `setUserSession`.
- `logoutUser` → clear token and `user_session`.
- Token extraction only if backend returns `access_token` or `token`.

### 4. User Context (`hooks/userContextProvider.tsx`)

- On mount: `checkAuthStatus` loads stored session and restores `user` + `role`.
- Registers `onUnauthorized` to clear user on 401.
- Exposes `isRestoringSession` for loading UI.

### 5. App Layout (`app/_layout.tsx`)

- Shows loading while `isRestoringSession`.
- Renders intro/login stack if `!user`, main stack if `user`.

---

## Backend Note (Flask-Login)

The guide states the backend is **cookie-only** (Flask-Login, `markt_session`). React Native may not persist cookies like a browser, so feed and other protected requests often return 401.

If you see 401 after login (e.g. "Feed error: Unauthorized"):

1. **Option A:** Confirm cookies work on device (`credentials: 'include'`). Test on a real device.
2. **Option B:** Ask backend to also return `access_token` or `token` in the login/register response and accept `Authorization: Bearer <token>` on protected routes. The app already supports this — it will attach the token when present.

## Toast Spam / Unauthorized Handling

- On 401: session is cleared, user redirected to login, one "Session expired" toast shown.
- Feed errors that are "Unauthorized" do **not** show a "Feed error" toast (avoids multiple identical toasts from parallel requests).

---

## Related

- **`docs/ROLES_AND_AUTH_VERIFICATION.md`** — User modes (buyer/seller), role switching, 401 vs 403 handling, and caller patterns.

## Testing Checklist

- [ ] Login → close app → reopen → user still logged in.
- [ ] Logout → `user_session` cleared.
- [ ] 401 on any request → user cleared, redirected to login.
- [ ] 403 on seller-only action (as buyer) → no redirect; error shown; can offer "Switch to seller".
- [ ] Session older than 7 days → treated as logged out.
