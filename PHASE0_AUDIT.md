# Phase 0 — Audit and design-system proposal

Verified against the code on `feat/onboarding-oauth`, 2026-09-10. Every claim
below cites what I checked.

> **On the four screenshots:** they're Chowdeck, not Markt — the Chowdeck banner
> and its Home/Search/Support/Profile tab bar are visible. I've treated them as
> the reference for the quality bar and audited Markt's code separately, rather
> than describing the reference back to you.

---

## 1. Your known defects, checked

| # | Claim | Verdict |
|---|---|---|
| 1 | Floating blue gear | **Not in this codebase** — see below |
| 2 | Three colour systems | **Confirmed, but not where you'd expect** |
| 3 | Geocode mis-map | **Confirmed — root cause found** |
| 4 | US defaults (`+1`, `10001`) | **Confirmed** |
| 5 | Hard borders, all-caps, card-in-screen | **Confirmed** |
| 6 | Sign-in better than sign-up | **Not applicable** (that screen is Chowdeck's) |

### 1.1 The gear — I can't remove what isn't there

Third check, three ways:

- **No blue exists in the palette.** `theme/tokens.ts` and
  `tailwind.config.js` contain no blue at all.
- **Every `Settings` icon is a list row** — `niches/[id].tsx` header,
  `profile.tsx` row, `NavDrawer.tsx`. None is floating.
- **Every absolutely-positioned round element is orange** (`bg-primary-fill`):
  the notification badge, the feed FAB, price pills, header buttons.
- **No dev-overlay package is installed** — no `expo-dev-client`,
  `expo-dev-menu`, `expo-dev-launcher`, or Flipper.

It also sits at the *same screen coordinate* across unrelated screens and over
the OS status bar, which app content cannot do.

**The one test that settles it:** take a screenshot with Markt fully closed. If
the gear is still there it's the OS or another app — check
**Settings → Accessibility → Touch → AssistiveTouch**, then any screen-recorder
you have installed.

I'd rather say this a third time than fabricate a fix and tell you it worked.
If it survives that test, send me the screenshot and I'll keep digging.

### 1.2 Three colour systems — the source is the *database*

The design tokens are a single orange system. The extra colours come from
three places, and only one is a genuine defect:

| Source | Colours | Verdict |
|---|---|---|
| **`gam_tier_config.color_hex`** | `#5C677D` slate, `#A0522D` sienna, `#9AA0A6` grey, `#E36414` orange, `#0F4C5C` teal, **`#3A86FF` bright blue** | **The real problem** |
| Google's brand mark | `#4285F4` `#34A853` `#FBBC05` `#EA4335` | Correct — trademark, must not be themed |
| Hash-derived identity palettes | avatar tints, niche tiles, medals | Intentional; the hue *is* the meaning |

**`#3A86FF` is your blue accent.** It renders on tier badges and progress bars.

The important part: these live in the **database**, so they bypass the token
system entirely and `theme:lint` cannot see them. Six arbitrary hues, chosen
without reference to the palette, rendering inside a themed UI.

**Fix:** map tiers onto token-derived colours and treat `color_hex` as a
legacy column. That is a data migration, not a CSS change.

### 1.3 Geocode mis-map — root cause

`app/(entrances)/locationdet.tsx:55-57`:

```ts
setValue("street", a.street ?? a.name ?? "");
setValue("city",   a.city   ?? a.subregion ?? "");
```

In peri-urban Nigeria `expo-location` returns `street: null`, `city: null`,
`name: "Lagelu"`, `subregion: "Lagelu"` — so **both fallback chains converge on
the same token** and Street and City both render "Lagelu". Exactly what you saw.

It also uses `expo-location`'s reverse geocoder, not Google's, so it never sees
the `administrative_area_level_2` component that carries the LGA properly.

### 1.4 Nigeria-correctness

| Defect | Location |
|---|---|
| `+1 (555) 000-0000` | `userdetBuyer.tsx:252`, `userdetSeller.tsx:240` |
| `10001` (US ZIP) | `locationdet.tsx:208` |
| **Postal code required** | `locationdet.tsx:36` — `z.string().min(1, "Postal Code is required")` |

The postal requirement is the worst of the three: it's a hard validation gate on
a value most Nigerian users don't know.

### 1.5 Email verification is not real

`AuthService.verify_email` exists and sets `email_verified = True`, with a
Redis-backed 6-digit code. What's missing: **no attempt limit, no lockout, no
resend rate limit**, and `email_verified` gates nothing. Resend *is* configured
(`RESEND_API_KEY`, `email_service.py`), so the transport is there — the
hardening isn't.

---

## 2. Design-system proposal

### 2.1 The palette decision — **yours, not mine**

Markt's brand is orange (`#E94C2A`). Chowdeck's green is what you're comparing
against. My recommendation, and the honest tradeoff:

**Recommendation: keep orange. Fix the *other* two systems instead.**

The green screens don't look better because they're green — they look better
because of spacing, rounded fields, one confident colour, and restraint. Every
one of those is achievable in orange. Switching hue is the most expensive
change available and the least likely to be the actual cause.

What genuinely needs fixing is that **six database-driven hues** and a
**vivid blue** are rendering inside an orange app. Fix that and the app reads as
one system.

**If you do want green**, it's a one-file change (`theme/tokens.ts`) plus a
contrast re-verification — my token work means the hue is swappable. But it's a
brand call and I won't make it silently. Say the word and I'll do it.

### 2.2 Tokens to add

The colour, spacing and elevation system already exists (`theme/tokens.ts`,
27 tokens, contrast-verified). What's missing is **type, radius and motion**:

```ts
// Type scale — currently ad-hoc (text-[34px], text-[22px], text-[13px] …)
display: 34/40  title: 28/36  heading: 22/28
body: 16/24     callout: 15/22  caption: 13/18  micro: 11/16

// Radius — currently a mix of rounded, rounded-2xl, rounded-full
sm: 8   md: 12   lg: 16   xl: 24   pill: 999

// Motion — nothing exists today
instant: 120ms   quick: 200ms   settle: 320ms
spring:  { damping: 18, stiffness: 180, mass: 0.7 }
```

Motion respects `useReducedMotion()`, which already exists and is honoured by
the celebration system.

### 2.3 Libraries

| Need | Choice | Why |
|---|---|---|
| Transitions, springs | **Reanimated 4.5.1** | Already installed, already used |
| Haptics | **expo-haptics** | Already installed |
| Skeletons, entrances | **Reanimated** | No new dependency needed |
| Illustration | **react-native-svg** (installed) | See below |

**I recommend against adding `moti`.** It's a wrapper over Reanimated, which is
already here and already used directly across the gamification work. Adding it
means two animation idioms in one codebase.

**I recommend against `lottie-react-native` — again.** Same reason as last time:
the assets don't exist. I'm not adding a dependency plus an asset pipeline for
files I'd have to invent. `react-native-svg` is installed and can carry a hero
illustration and empty states now. **If you have or can commission real Lottie
assets, tell me and I'll add it** — that changes the answer.

---

## 3. Blockers

1. **PostGIS is not available** on this Postgres 16.15 instance (verified:
   `pg_available_extensions` has no `postgis`). Shapes the ADR — see
   `LOCATION_ARCHITECTURE.md`. **I need to know whether production has it.**
2. **Google Maps API key** — the app uses `expo-location`'s reverse geocoder
   today, not Google's. Map-first addressing needs a Maps/Places key with
   Geocoding + Places enabled, and a billing account.
3. **The gear** — needs your screenshot-with-app-closed test.
4. **The palette decision** — orange vs green is yours.
