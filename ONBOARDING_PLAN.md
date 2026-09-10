# Phase 1 — Implementation plan

## A. The new onboarding flow

**Principle applied: value before friction.** `/products` and `/products/<id>`
are already public on the backend (verified — no `@login_required`), so a guest
can browse the real catalogue with **no backend change and no fake data**. The
personalised feed *does* require auth, so guests see the catalogue, not the feed.

| # | Screen | Who sees it | Fields |
|---|---|---|---:|
| 1 | **Welcome** — one value line, `Continue with Apple` (iOS), `Continue with Google`, `Continue with email`, and a quiet **"Browse first"** | everyone | 0 |
| 2 | *(guest)* **Catalogue** — real products, browsable | guests | 0 |
| 3 | **Sign-in wall** — appears only at the first action that needs an account (add to cart, chat, post) | guests who act | 0 |
| 4 | **Email path** — email + password on one screen, `Sign in` / `Create account` on one control | email users | 2 |
| 5 | **Name** — "What should we call you?" (one field, prefilled from the provider when OAuth gave us one) | new users | 1 |
| 6 | **Role** — buyer / seller, asked *here* with a sentence explaining each | new users | 0 (tap) |
| 7 | *(seller only)* **Shop basics** — shop name + categories | new sellers | 2 |

**16 fields → 3 for a buyer, 5 for a seller.** Address, phone, profile picture
and shop description move to a "complete your profile" prompt at the point they
are actually needed (checkout needs an address; nothing else does).

Progress: a step dots row on 5–7 only, so the user always knows the remaining
count. Every screen has explicit loading / error / empty / success states, and
`replace` (not `push`) on completion so the flow leaves no history behind (F8).

## B. OAuth architecture, in words

```
App                          Backend                       Provider
 |  native sign-in sheet        |                              |
 |----------------------------->|                              |
 |  <- identity token (JWT) + nonce                             |
 |                              |                              |
 |  POST /users/auth/oauth      |                              |
 |  {provider, identity_token,  |                              |
 |   nonce, name?}              |                              |
 |----------------------------->|                              |
 |                              |  GET JWKS (cached)           |
 |                              |----------------------------->|
 |                              |  verify: signature (RS256),  |
 |                              |  iss, aud == our client IDs, |
 |                              |  exp, nonce                  |
 |                              |                              |
 |                              |  find by (provider, sub)     |
 |                              |   -> link / create / return  |
 |  <- {user, access_token}     |                              |
 |<-----------------------------|                              |
 |  store token in SecureStore  |                              |
```

The client token is **never trusted** — it is only a carrier. The backend mints
its own `generate_auth_token` bearer, identical to the password path, so every
existing consumer is unchanged.

## C. Files

**`markt_python`** (branch `feat/oauth-social-login`)
- `app/users/oauth.py` — JWKS fetch + cache, Google and Apple verifiers
- `app/users/services.py` — `authenticate_with_provider()`: link / create / return
- `app/users/models.py` — new `SocialAccount` table (provider, provider_sub, user_id)
- `app/users/routes.py` + `schemas.py` — `POST /users/auth/oauth`
- `main/config.py` — `GOOGLE_*`, `APPLE_*` via `config()`
- migration + `tests/test_oauth.py`
- `requirements.txt` — `pyjwt[crypto]` (JWKS/RS256; already-present `requests` fetches keys)

**`markt_mobile`** (branch `feat/onboarding-oauth`)
- `services/authStorage.ts` — **SecureStore** with a one-time AsyncStorage migration
- `services/sections/oauth.ts`, `hooks/useSocialAuth.ts`
- `components/auth/SocialAuthButtons.tsx` — Apple's official button on iOS
- rebuilt `app/(entrances)/*`, guest routes in `app/_layout.tsx`
- `app.json` — plugins + iOS URL scheme + `usesAppleSignIn`
- `SETUP_OAUTH.md`, `.env.example` in both repos

## D. Migrations
One additive table (`social_accounts`) with a unique index on
`(provider, provider_sub)`. No column dropped, no existing row touched.
`password_hash` is already nullable, so an OAuth-only user needs nothing extra.

## E. Assumptions
1. Guests browse the **product catalogue**, not the personalised feed (that one
   is `@login_required` and making it public is a product decision, not mine).
2. OAuth users get a generated username (`name` slug + short suffix, retried on
   collision) since `username` is `unique NOT NULL`. Editable later.
3. Apple's name arrives **once**, on first authorisation only — persisted then or
   never; the Name screen is prefilled when we got it and asked when we didn't.
4. Email stays unverified for Apple private-relay addresses; we do not email-gate
   OAuth users.
5. Existing email/password login is untouched and keeps working.

## F. Needs your decision
See the question I'm asking alongside this plan — the account-linking policy has
a real security consequence and I don't want to pick it silently.
