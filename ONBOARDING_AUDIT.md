# Phase 0 — Stack summary and onboarding friction audit

Investigated 2026-09-06. Everything below is read from the codebases, not assumed.

---

## 1. Stack

### `markt_mobile`
| | |
|---|---|
| Workflow | **Expo managed**, SDK `~57.0.20` — no `ios/` or `android/` directory |
| React Native | `0.86.3` |
| Navigation | **expo-router** (file-based), with `<Stack.Protected guard={...}>` |
| Styling | **NativeWind v4** over a semantic token system (`theme/tokens.ts`, `useTokens()`) |
| Data layer | `@tanstack/react-query` + React context providers |
| API client | `services/api.ts` — `Authorization: Bearer <token>` |
| Token storage | `services/authStorage.ts` — **AsyncStorage** |
| Build | EAS (`eas.json`) |

### `markt_python`
| | |
|---|---|
| Framework | **Flask 2.3.2** + flask-smorest (marshmallow schemas, OpenAPI) |
| Auth | **Flask-Login session _and_ a bearer token** — dual path |
| Bearer token | `app/libs/auth_tokens.py` — `itsdangerous.URLSafeTimedSerializer`, signs the user id with `SECRET_KEY`, 30-day max age. **Not a JWT.** |
| Passwords | `passlib` `pbkdf2_sha256`; `password_hash` is **nullable** |
| Migrations | Alembic via Flask-Migrate |
| Config | `python-decouple` `config()` in `main/config.py` |
| Tests | pytest, ~606 passing |

### Consequences for this work
- **Expo managed → `expo-apple-authentication` and `@react-native-google-signin/google-signin`.** The Google package ships a config plugin and works in managed via a dev/EAS build; it gives the native one-tap sheet, which `expo-auth-session`'s browser round-trip does not. Neither works in Expo Go — a **development build is required**.
- **Tokens are itsdangerous, not JWT.** OAuth must mint the *same* token type via `generate_auth_token` so nothing downstream changes.
- **`password_hash` is already nullable** — an OAuth-only user needs no schema workaround.
- No JWT/JWKS library present; one must be added for provider token verification.

---

## 2. Friction audit — the current flow

Six screens and **sixteen fields** stand between opening the app and seeing anything.

| # | Screen | Fields | Notes |
|---|---|---:|---|
| 1 | `introduction` | — | Marketing splash |
| 2 | `signup` | 3 | Email, password, confirm password + buyer/seller toggle |
| 3 | `userdetBuyer` / `userdetSeller` | 3 / 4 | Username, name, phone (+ shop name, description, categories for sellers) |
| 4 | `locationdet` | 6 | Full address: street, city, state, LGA, landmark, postal |
| 5 | `addProfilePicture` | 0 | Image picker |
| 6 | `emailVerification` | 6-digit code | Then `router.push("/")` |

### The problems, worst first

**F1 — A hard wall before any value.** `app/_layout.tsx` gates everything behind
`<Stack.Protected guard={isLoggedIn}>`; logged out, the only reachable route is
`introduction`. Nobody can see a product, a price, or a seller before committing
to a six-screen signup. This is the single biggest conversion problem and it
violates "value before friction" outright.

**F2 — Everything is demanded up front.** All 16 fields are collected *before*
first use. A full postal address is required to browse. Sellers must pick
categories and write a shop description before they have seen the app.

**F3 — No social auth at all.** Email + password is the only path. On iOS this
is also an App Store risk the moment any social login is added (see below).

**F4 — Role is chosen too early, on the wrong screen.** Buyer/seller is a
segmented control on the *signup* screen, before the user knows what either
means, and it silently forks the next three screens.

**F5 — Tokens live in AsyncStorage.** `services/authStorage.ts` stores the bearer
token in AsyncStorage, which is **unencrypted** — plain text on a rooted or
jailbroken device, and readable from a device backup. The brief's requirement for
Keychain/Keystore is not currently met.

**F6 — Sign-in and sign-up are not distinct.** Returning users land on the same
marketing splash and must find their way to login.

**F7 — Progress is invisible.** No step indicator anywhere across the six
screens; the user cannot tell whether they are one screen from done or four.

**F8 — Dead ends.** `emailVerification` ends in `router.push("/")` rather than
`replace`, leaving the whole signup stack in history — iOS swipe-back returns
into the flow the user just finished.

### Verified, not assumed
- Server-side, `register_user` requires email **and** username in one call and
  rejects duplicates of either — so an OAuth user needs a generated, collision-safe
  username.
- Registration is single-shot: there is no partial-account concept to build a
  deferred flow on top of without backend work.

---

## 3. Blockers requiring credentials I do not have

Neither provider can be exercised end to end from here. Both are listed in
`SETUP_OAUTH.md` with exact acquisition steps:

- Google **Web** client ID (backend audience) + **iOS** and **Android** client IDs.
- Apple **Team ID**, **Services ID**, **Key ID** and the **`.p8` private key** —
  these need a **paid Apple Developer account** ($99/yr).
- Sign in with Apple can only be tested on a **physical iOS device or a
  simulator signed into an Apple ID**; it cannot be tested on Android at all.

I will build and unit-test both paths against fixtures, but the live
console-to-device round trip is yours to run.
