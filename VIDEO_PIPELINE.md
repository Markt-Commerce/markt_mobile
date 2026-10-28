# Product video pipeline

Seed → record → render, all reproducible. Three stages, each re-runnable on
its own:

| Stage | Where | Command |
|---|---|---|
| 1. Backend + curated data | `../markt_python` | `scripts/demo_up.sh` |
| 2. Screen recordings | `demo/` | `demo/record.sh <video> all` |
| 3. Motion graphics + render | `video/` | `npm run render` |

## The videos

| Video (`record.sh` name / Remotion id) | Story | Length |
|---|---|---|
| `marketplace` / `Marketplace` | Feed → product → chat → checkout with the delivery fee → rider on the way | 36.8s |
| `communities` / `Communities` | Find a community, join it, its posts come to your feed | 21.9s |
| `shops-near-you` / `ShopsNearYou` | Every shop by distance, switch area, open a verified shop | 21.3s |
| `buy-and-sell` / `BuyAndSell` | Ada switches to her shop and accepts an order | 19.4s |
| `better-price` / `BetterPrice` | Seller's discount in chat → it comes off at checkout | 18.2s |
| `share-the-ride` / `ShareTheRide` | Share the delivery, pay the solo fee, get the difference back | 21.5s |

Each renders to `video/out/<name>-vertical.mp4` (1080×1920),
`<name>-landscape.mp4` (1920×1080) and `-clean` versions of both without
captions, loudness-levelled to −14 LUFS.

---

## One-time setup

- **Docker Desktop**, **Xcode** with an iPhone 17 Pro simulator, **Maestro**
  (`brew install maestro`), **ffmpeg** (`brew install ffmpeg`), **Node 24**.
- `.env` in this repo points the app at the local backend (it is gitignored):

  ```
  EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
  EXPO_PUBLIC_SOCKET_URL=http://localhost:8000
  ```

- Build the **Release** app for the simulator and install it. Release, not a
  dev build: no Metro, no dev overlays (LogBox), and the API URL is baked in.

  ```sh
  npx expo prebuild --platform ios          # generates ios/ (gitignored)
  xcodebuild -workspace ios/MarktCommerce.xcworkspace -scheme MarktCommerce \
    -configuration Release -sdk iphonesimulator \
    -destination "platform=iOS Simulator,name=iPhone 17 Pro" \
    -derivedDataPath ios/build build
  xcrun simctl boot "iPhone 17 Pro"; open -a Simulator
  xcrun simctl install booted ios/build/Build/Products/Release-iphonesimulator/MarktCommerce.app
  ```

  `npx expo run:ios` currently stops with "No code signing certificates"
  because the app declares Sign in with Apple; the `xcodebuild` route above
  needs no signing for the simulator. Rebuild whenever app code or `.env`
  changes.

- `cd video && npm install` once.

---

## 1. Backend and data (`markt_python`)

```sh
scripts/demo_up.sh            # build/start, migrate, seed -- idempotent
scripts/demo_up.sh --fresh    # wipe the demo database first
scripts/demo_up.sh --down     # stop (keeps data)
```

`docker-compose.demo.yml` runs Postgres, Redis (redis-stack), the API, a
Celery worker and an nginx serving seeded images on `:8090`. Host ports are
off the defaults (Postgres 55432, Redis 56379); the API is on `:8000`. Celery
beat is deliberately off: its jobs expire orders and allocations, which would
change the screens between takes. Shared delivery runs
(`DELIVERY_BATCH_ENABLED`) are on.

What the seed creates:

- **`scripts/seed_demo.py`** — 5 Ibadan shops (Bodija, UI, Agbowo, Sango
  markets), 4 buyers, 17 products with ₦ prices, posts with likes and
  comments, chat threads, a paid showcase order with a rider (Kunle Adebayo)
  en route.
- **`scripts/seed_demo_stories.py`** — what the feature videos need: shop
  banners and logos, five communities, Ada holding both roles with a fresh
  order to accept, a pending 10% chat discount from Ada to Temi, and two
  neighbours' shared-delivery orders heading to UI.
- **Logins** (all `MarktDemo#2026`): `temi@example.com` (buyer, ₦150,000
  wallet, "Hostel" address at Queen Elizabeth II Hall), and
  `adaeze.okafor@example.com` (Ada, seller and buyer).

Every run puts the demo back: fixed ids, and everything a take can change
(cart, chats, likes, wallets, unread badges, memberships, the discount,
feed cache) is reset. **Re-seed right before recording**: timestamps are "N
minutes ago" from the seed, the warmed feed cache lasts 30 minutes, and a
seller has three minutes to answer an order. `record.sh` re-seeds for you.
Orders placed during takes are not undone; `--fresh` clears them.

**Images.** Product, post, banner and community photos come from
`demo/images/` (credits in `demo/images/CREDITS.md`; all from Wikimedia
Commons under CC0, public domain, CC BY or CC BY-SA). Shop logos are drawn
monograms (the shops are fictional). To use your own, drop files with the
same names there (keys in `demo/images/README.md`; banners in `banners/`,
community images in `niches/`, logos/avatars in `avatars/`) and re-run.
Anything missing becomes a labelled placeholder -- the seed never downloads.

## 2. Recording (`demo/`)

```sh
demo/record.sh list                       # videos and their beats
demo/record.sh communities all            # every beat of one video
demo/record.sh marketplace 04-checkout    # one beat
demo/record.sh marketplace 04-checkout --no-reseed
```

Flows live in `demo/maestro/videos/<video>/`. Per beat: re-seed (unless the
beat has a `<beat>.noreseed` file), run `<beat>.pre.sh` if there is one, set
the marketing status bar (9:41, full battery and signal, no carrier), run
`<beat>.setup.yaml` unrecorded, then record `<beat>.yaml` with `simctl io
recordVideo` and trim the idle ends (`demo/trim_clip.py`, which also turns
simctl's variable-frame-rate output into a steady 60fps).

The feature videos are **single takes** (`01-story`), cut into beats in the
edit: joining a community or paying changes state, so the story is recorded
in one go. `share-the-ride` is the exception -- two takes with a few hours
skipped between them: `01-optin.pre.sh` starts from a fresh database (a
shared run needs neighbours who haven't travelled yet), and
`02-settled.pre.sh` closes and settles the run so the refund exists.

Raw takes: `demo/recordings/raw/<video>/`. Trimmed clips used by the video:
`video/public/clips/<video>/`. Neither is committed (they are large and
regenerable): record them here, or copy them from the team's Google Drive,
where the finished videos are kept too. Run a flow by hand with
`cd demo/maestro/videos/<video> && maestro test <beat>.yaml`.
`demo/maestro/smoke.yaml` checks that every marketplace screen loads.

Notes from building the flows:

- The app has no `testID`s; flows target accessibility labels and visible
  text. A few targets are positional (the product page's header cart icon,
  the tagged product on a post) -- if the layout changes, those lines move.
- Toasts sit over the tab bar; flows wait for them to go before tapping a tab.
- `shared/login.yaml` signs in as Temi; pass `env: {EMAIL: ...}` for another
  account (buy-and-sell signs in as Ada).

## 3. Video (`video/`)

```sh
cd video
npm run studio                    # Remotion Studio: scrub, tweak, preview
npm run render                    # every video, all four outputs each
npm run render -- Communities     # one video
npm run loudnorm                  # re-level existing renders to -14 LUFS
```

The edits are data, in `src/videos.ts`: each video's open and close lines,
its beats (caption + the clip segments it cuts, seconds within the trimmed
clip) and optional push-ins. After re-recording, check the in/out points --
a new take can shift by a few tenths of a second. A still is the quickest
check:

```sh
npx remotion still src/index.ts CommunitiesVertical out/check.jpg --frame=300
```

- **Phone frame:** drawn in code (`src/components/Phone.tsx`). To use Apple's
  iPhone 17 Pro bezel instead, set `APPLE_BEZEL` in `src/theme.ts` to a local
  PNG path. Don't commit Apple's files, and check its licence first: it
  covers mock-ups of apps that run only on Apple platforms.
- **Music:** `public/audio/allada.mp3` — "Allada" by Kevin MacLeod
  (incompetech.com), CC BY 4.0, for every video. Each ends on a different
  phrase of the track (`musicDrop`: 48.4s, 115.5s or 192.0s), so posts on
  consecutive days don't sound identical.
- **Logo:** `public/brand/markt-logo-white.svg`, traced from the app icon.
  Swap in the official SVG when there is one.
- **Font:** the app renders in the iOS system font, so the video uses
  `system-ui` (SF Pro when rendered on a Mac).

## Credits to publish with the videos

```
Music: "Allada" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/

Photos: Wikimedia Commons contributors (CC0 / CC BY / CC BY-SA);
full list in markt_python/demo/images/CREDITS.md.
```
