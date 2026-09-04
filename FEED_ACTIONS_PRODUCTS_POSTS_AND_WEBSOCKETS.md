# Agent Task: Redesign `markt_mobile` Onboarding + Implement Google/Apple OAuth (mobile + backend)

## Your role
You are a senior product engineer and interaction designer. You own this feature end to end: UX, UI, mobile implementation, backend implementation, and the human setup guide. Optimize for a shippable, secure, delightful result — not a demo.

## Repos in scope
- `markt_mobile` — the React Native mobile app (primary).
- `markt_python` — the backend. You may modify it freely if the work needs it.

## What I want, in one sentence
Rebuild the onboarding flow so it's noticeably better in UX and UI, and add "Sign in with Google" and "Sign in with Apple" across the backend and mobile app.

---

## Phase 0 — Understand before you touch anything (no code yet)
Do this first and report what you find. **Do not assume the stack.**

1. In `markt_mobile`, determine: Expo (managed/prebuild) vs bare React Native; RN version; navigation library; state/data layer; existing auth (screens, token storage, API client); design system / theming / component conventions; how env/secrets are handled.
2. In `markt_python`, determine: framework (FastAPI / Django / Flask / other); how auth currently works (sessions vs JWT), user model, password handling, migrations tooling, config/secrets loading, and existing tests.
3. Map the current onboarding flow screen by screen and note every point of friction (fields, steps, dead ends, unclear copy, missing states).
4. Identify the exact library choices that fit *this* codebase (see "Recommended libraries" below, but adapt to what you find — e.g. Expo vs bare changes the Apple/Google packages).

**Deliverable for Phase 0:** a short written summary of the stack + a friction audit of the current onboarding. Then stop and present your plan (Phase 1) before implementing.

## Phase 1 — Plan and get sign-off
Produce a concise implementation plan covering: the new onboarding flow (as a screen-by-screen list), the OAuth architecture (token flow diagram in words), the files you'll add/change in each repo, migrations, and anything that needs my decision. List assumptions explicitly. Wait for my go-ahead, or proceed if I've told you to run autonomously.

---

## Phase 2 — Onboarding redesign (UX first, then UI)
Apply real design judgment. The bar is "a designer would be proud of this," not "it functions."

**UX principles to apply:**
- **Value before friction.** Let people see/feel the app's value before demanding a signup. Defer account creation as late as is reasonable.
- **Fewest possible steps.** Every screen and field must justify its existence. Cut anything not essential to first value.
- **Progressive disclosure.** Ask for one thing at a time; don't dump a giant form.
- **Social auth up top.** Make Google/Apple the primary, frictionless paths; email/password secondary.
- **Clear progress + orientation.** People should always know where they are and how much is left.
- **Great empty, loading, error, and success states.** No dead ends. Every failure has a recovery path and human-readable copy.
- **Respect returning users.** Sign-in and sign-up should be obviously distinct and fast.
- **Accessibility is not optional:** proper labels, hit targets ≥44pt, dynamic type support, sufficient contrast, screen-reader flow, reduced-motion respected.

**UI craft:**
- Honor the existing design system if one exists; if it's thin, establish consistent spacing, type scale, and color/elevation tokens and use them everywhere.
- Purposeful motion: transitions that aid orientation, not decoration. Keep it smooth on mid-range devices.
- Pixel-level polish: alignment, optical spacing, consistent iconography, platform-appropriate feel on both iOS and Android.
- Write the microcopy yourself and make it warm, clear, and short.

**Deliverable:** the rebuilt onboarding flow, wired to real navigation and the auth backend, with all states handled.

## Phase 3 — Backend OAuth (`markt_python`)
Implement Google and Apple sign-in server-side.

- Add endpoints that accept the **identity token from the mobile app** and verify it **server-side** — never trust the client token blindly. Verify signature, issuer, audience (your client IDs), and expiry against the provider's public keys.
- **Google:** verify the ID token against Google's certs / use the appropriate Google auth library for the framework; audience = your OAuth client ID(s).
- **Apple:** verify the identity token against Apple's public keys (JWKS); validate `iss`, `aud`, `exp`, and `nonce`. Handle that Apple only returns the user's name **once, on first authorization**, and may return a **private relay email** — persist what you get on first sign-in.
- **Account model & linking:** decide and implement how a Google/Apple identity maps to a `markt_mobile` user. Support linking when the verified email matches an existing account, and handle the case where it doesn't. Store the provider + provider-subject-id, not just email.
- Issue **your own** session/JWT after verification, consistent with existing auth. Implement refresh and sign-out to match current patterns.
- Add DB migrations for any new fields/tables. Load all secrets from config/env — never hardcode.
- Add tests: token verification (valid/expired/wrong-audience/tampered), new-user vs returning-user, and account-linking paths.

## Phase 4 — Mobile OAuth wiring (`markt_mobile`)
- Add the Google and Apple sign-in buttons to the redesigned onboarding, using platform-correct, guideline-compliant buttons (Apple's button must follow Apple's Human Interface Guidelines; **"Sign in with Apple" must be offered on iOS if you offer any third-party social login**, or Apple will reject the app).
- On success, send the identity token to the new backend endpoints; on backend success, store the session token **securely** (Keychain / Keystore — **not** plain AsyncStorage) and route the user into the app.
- Handle every branch: user cancels, no network, provider error, backend rejects, first-time vs returning, and account-link conflicts. Show human copy, never a raw error.
- Show Apple sign-in only where supported; degrade gracefully on Android.

## Cross-cutting requirements
- **Security:** server-side token verification, secure token storage, no secrets in the repo, CSRF/nonce where relevant, least-privilege scopes.
- **Config:** everything provider-specific (client IDs, key IDs, team ID, bundle IDs) comes from env/config in both repos, with `.env.example` updated.
- **Quality:** match existing lint/format/type conventions; keep commits logical and well-messaged; update any affected docs/READMEs.
- **Don't fabricate.** If you can't verify something in the codebase or need a credential I haven't provided, list it as a blocker rather than guessing.

## Recommended libraries (adapt to the detected stack)
- Google (RN): `@react-native-google-signin/google-signin` (send its `idToken` to the backend).
- Apple (bare RN): `@invertase/react-native-apple-authentication`. Apple (Expo): `expo-apple-authentication`.
- If it's Expo managed and you want one abstraction: `expo-auth-session` is an option — but native Google/Apple modules generally give the best UX; justify your choice.
- Backend: use the framework-idiomatic library for JWT/JWKS verification.

## Final deliverables
1. Working onboarding + Google/Apple sign-in across both repos, committed on a clearly named branch (or PRs) per repo.
2. A **Phase 0 summary + friction audit**.
3. A **"What YOU need to set up" guide** written for me (see below) — this is required, put it in `SETUP_OAUTH.md` at the root of `markt_mobile`.
4. A short **testing/QA checklist** covering how to verify each flow on iOS and Android.

### The setup guide (`SETUP_OAUTH.md`) must cover, with exact values I need to obtain and where each goes:
- **Google Cloud Console:** OAuth consent screen; creating **Web, iOS, and Android** OAuth client IDs; where the Android SHA-1/SHA-256 fingerprints come from (debug + release) and how to get them; which client ID goes in the mobile app vs which is the backend "audience"; the iOS URL scheme if required.
- **Apple Developer:** App ID with the **Sign in with Apple** capability; the **Services ID**; creating the **Sign in with Apple key (.p8)** and where to store it; my **Team ID**, **Key ID**, and **bundle identifier** — and exactly which env var each maps to in `markt_python`.
- **Env vars:** every new variable added to both repos, with a filled-in `.env.example`.
- **Native config:** any `Info.plist` / entitlements / `app.json`/`app.config` / Gradle changes, stated explicitly.
- **Order of operations:** a numbered checklist of what I do on my end and in what sequence, plus how to test that each provider works end to end.
- Flag anything requiring a **paid Apple Developer account** or a **physical iOS device** for testing.

## Definition of done
A new and returning user can complete the redesigned onboarding and sign in with Google and with Apple, on both platforms; tokens are verified server-side and stored securely; all states are handled; tests pass; and I have a setup guide precise enough to configure the provider consoles without further questions.