# Follow-up Task: Make `markt_mobile` feel modern, fix onboarding correctness, and add location-aware content

## Context (this continues prior work — don't restart from zero)
This builds on the onboarding + OAuth work already in flight: backend PR (`markt_python`) and mobile PR (`markt_mobile`). I've reviewed screenshots of the current build and it works, but it looks unfinished and is missing a core capability (location-scoped content). Known stack facts — **verify anything you're unsure of in-repo before building**:
- **Mobile:** Expo (managed workflow), React Native, Expo Router. Native modules require a dev build (not Expo Go).
- **Backend:** Python (`markt_python`); auth uses `itsdangerous`-signed bearer tokens (not JWT). **Resend is already configured** for email. Google Maps/Places is already used for the address picker.
- **Market:** Nigeria-first. Currency is Naira (₦). Defaults, formats, and addressing must be Nigeria-correct.

**Quality bar:** the reference is Chowdeck — clean, warm, confident, with purposeful motion. "Clean" there is not minimalism-by-omission; it's generous spacing, soft rounded fields, one confident brand color, restrained illustration, and tactile feedback. The current build reads as a wireframe. Fix that.

---

## Phase 0 — Audit + get sign-off before building (no feature code yet)
Produce three short artifacts and **wait for my approval**:

1. **Visual/UX audit** of the current screens (landing, create account, profile, location, home feed), listing concrete defects. Include the ones I already know about (below) and anything else you find.
2. **Design-system proposal**: one palette + type scale + spacing/radius/elevation + motion tokens. Recommend consolidating onto a single primary color (the app currently mixes orange, green, and a blue accent). The green screens are cleaner and closer to the target aesthetic — recommend a direction and note the tradeoff, but flag this as my brand decision.
3. **Location architecture ADR** (see Workstream C) — the most important deliverable. Present options, recommend one, wait for sign-off.

Known defects to fold into the audit (confirm each against the code):
- A floating **blue gear/settings button** appears on nearly every screen, overlapping the progress bar, product images, and headers. It looks like a shipped debug tool.
- **Three color systems** in use at once (orange / green / blue).
- **Geocoding mis-map:** Street Address and City both render the same token ("Lagelu", an LGA) — one value is being written to multiple fields.
- **US-centric defaults:** `+1` phone placeholder, `10001` (a US ZIP) as postal placeholder.
- Hard-bordered rectangular inputs, all-caps letter-spaced buttons, bordered "card inside a screen" wrappers, no skeletons, no motion, no illustration.
- **Design inconsistency:** the sign-in ("Welcome back") screen already uses the better pattern (rounded fields, `+234`, softer buttons); the create-account/profile flow does not.

---

## Workstream A — Design system, modern feel, and motion
- **Unify to one design language.** Implement the approved tokens (color, type, spacing, radius, elevation, motion durations/easings) and apply them everywhere. Kill the mixed palettes.
- **Remove the floating gear button** from all user-facing screens. If it's a dev menu, gate it behind `__DEV__` only.
- **Modernize inputs:** soft rounded fields with clear focus states, inline validation, helper/label hierarchy, larger touch targets. Remove all-caps letter-spaced button labels. Remove decorative bordered cards that only add noise.
- **Add motion (Expo-native stack — verify versions against the installed Expo SDK):**
  - `react-native-reanimated` (bundled with Expo) + `moti` for declarative transitions.
  - `react-native-gesture-handler` for gestures; `expo-haptics` for tactile feedback on key actions (submit, select location, verify).
  - `lottie-react-native` (or `@shopify/react-native-skia` for custom graphics) for illustrated empty/success states.
  - Concretely: animated screen transitions, button press/scale feedback, **skeleton loaders** for the feed, list-item entrance animations, animated progress-bar fill, success checkmark on verify/finish.
  - Target 60fps on mid-range Android. Respect the OS **reduce-motion** setting.
- **Add warmth/graphics:** a hero illustration on the landing screen, illustrated empty and success states, a refined product card. Keep it restrained — polish comes from spacing, hierarchy, and consistency, not decoration.

## Workstream B — Onboarding correctness
1. **Fix the back-navigation bug.** After successful account creation/onboarding, the user can iOS-swipe (and hardware-back) into the auth screens. Restructure into `(auth)` and `(app)` route groups; on completion, **reset/replace** the stack so the auth group unmounts. Guard routes both ways (authed users can't reach auth screens; unauthed can't reach app screens). Verify neither swipe nor hardware back can re-enter completed steps.
2. **Implement real email verification** (Resend is already configured). Today any email is accepted with no verification.
   - Backend: generate a short-lived 6-digit code (and/or magic link), send via Resend; add verify + resend endpoints with expiry, rate limiting, and attempt lockout; persist a `verified` flag; gate sensitive actions on it.
   - Mobile: an OTP screen with auto-advancing inputs, paste support, a resend countdown, and clear error/success states. Recommended placement: immediately after email+password, before profile.
   - **Skip verification for Google/Apple sign-in** (provider already verifies the email) — but keep verifying the provider token server-side as implemented previously.
3. **Fix the phone input.** Default to **+234 with the Nigeria flag**, keep the country picker, validate against the selected country. The sign-in screen already does this correctly — extract one shared phone component and use it everywhere (profile currently defaults to `+1`).
4. **Fix the address form UX** (architecture is in Workstream C; this is the form itself):
   - **Do not require postal code.** Nigeria uses 6-digit NIPOST codes, but there's no single national code, most users don't know theirs, and it's a common error source. Make it optional or remove it.
   - **Fix geocode field mapping:** map address components correctly (route/street_number → street; locality → city; administrative_area → state; LGA where available) and never write one token into multiple fields.
   - **Go map-first (Chowdeck-style):** search box + draggable pin + a free-text "apartment / landmark / delivery note", with state/LGA derived from the geocode. This matches how Nigerians actually give addresses.
5. **Integrate Google/Apple buttons cleanly** into the redesigned landing/auth. They were added previously but hidden in Expo Go; ensure they render natively and on-brand in a dev build, preserving the graceful-hide-when-unavailable behavior.

## Workstream C — Location-aware content (the core new capability)
**Goal:** the feed (posts/products) is relevant to the user's current location, and a **top-left header location switcher** (Chowdeck-style) re-scopes content instantly — for signed-in users *and* guests.

**Decide first, then build (ADR).** I framed this as "multitenant, location = tenant." Evaluate that rather than implementing it literally, because hard tenant isolation walls off inventory and thin inventory kills marketplaces (a buyer often still wants a good deal one town over, or a seller who ships nationally).
- **Recommended default:** geospatial proximity scoping + relevance ranking around a **selected "browse location"** — *not* rigid tenancy.
- Only choose strict locality isolation if a concrete product requirement demands it (e.g. hyperlocal-only).
- Present both options with tradeoffs, recommend one, and get my sign-off before implementing.

Assuming the geo-proximity model is approved:
- **Backend:**
  - Detect the DB. If **Postgres**, use **PostGIS** (geography columns, GIST indexes, `ST_DWithin`/`ST_Distance`). If PostGIS isn't available, fall back to **geohash-prefix + bounding-box prefilter + Haversine** ranking. Add proper spatial indexes either way.
  - Attach a **location** (lat/lng + derived region/LGA/state) to sellable content (products, posts, shops), captured from the seller's shop/pickup location at creation.
  - Introduce a **browse location** concept **decoupled from the saved account/shipping address** (Chowdeck lets you change delivery location without editing your profile). Persist it per user/session; support a **guest** browse location.
  - Feed endpoints accept location + radius (or region), return **distance-ranked, paginated** results (keyset/cursor pagination stable under geo ranking).
  - Define a **fallback ladder** when nothing is nearby: expand radius → nearest results → nationwide, so low-density/new areas never see an empty app.
  - **Migrations + backfill:** geocode existing shops/products. Keep queries fast at scale (indexing, and caching for hot areas if warranted).
- **Mobile:**
  - **Header location control** (top-left) showing the current browse location with a chevron; tapping opens the map-first picker (reuse the address picker from Workstream B). Selecting updates a global location store and refetches the feed with an optimistic, animated transition.
  - Works for **guests** too.
  - Persist the selected location locally; on first launch, prime the location permission and offer "use current location".
  - Skeletons while loading; clear empty/fallback states.
- **Keep account/shipping address separate from browse location** — make the distinction explicit in both code and UI.

## Workstream D — Screen-by-screen targets
- **Landing:** hero illustration/graphic, strong headline retained, email + Google + Apple as clear options, prominent "Browse first" (ties to guest + location). Remove gear.
- **Create account:** modern fields, restyled Buyer/Seller toggle, consider dropping "Confirm Password" in favor of show/hide + strength meter, inline validation, unified palette.
- **Profile:** `+234` default, modern fields, better Add-Photo control, progress bar with step labels + animated fill.
- **Location/address:** map-first, postal optional, correct geocoding, no gear, no bordered-card noise.
- **Home feed:** add the location switcher header, skeletons, entrance animations, refined product card (remove the gear currently sitting on the product image), and reconsider the "57w"-style stale-looking timestamps.

## Cross-cutting
- **Accessibility:** labels, contrast, dynamic type, reduce-motion, ≥44pt targets, screen-reader order.
- **Performance:** feed latency and spatial indexes, image handling, 60fps animations.
- **Analytics** (if a layer exists): onboarding funnel, email-verification completion, location changes.

## Deliverables
1. Phase 0 audit + design-system proposal + **location ADR** (await sign-off).
2. Implemented changes across `markt_mobile` and `markt_python`, on clear branches/PRs, CI green.
3. Updated `SETUP_OAUTH.md`, plus any new env/config (Maps keys, etc.), a `LOCATION_ARCHITECTURE.md` ADR, and migration/backfill notes.
4. A QA checklist covering: email verification via Resend, inability to swipe/back into completed auth, `+234` default, no forced postal code, correct geocoding, and location switching re-scoping the feed for both users and guests.

## Definition of done
The app feels modern (cohesive palette, purposeful motion, no floating gear); defaults are Nigeria-correct (₦, +234, no forced postal, map-first addressing); email verification via Resend actually works; users cannot navigate back into completed auth; and a header location switcher re-scopes the feed for both signed-in users and guests, backed by a documented, sensible geospatial architecture.

## Constraints
- Match existing lint/format/type conventions; logical, well-messaged commits.
- Don't hardcode secrets; update `.env.example` in both repos.
- If you can't verify something in the codebase or need a credential/key I haven't provided, list it as a blocker rather than guessing.