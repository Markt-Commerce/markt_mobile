# Dark mode audit — before

Measured on `feat/ux-pass-ratings-requests-settings`, 2026-09-05. Everything
below is counted or computed, not estimated.

---

## 1. How theming works today

**Selection is fine and doesn't need changing.** `components/themeProvider.tsx`
resolves `system | light | dark`, listens to `Appearance`, persists the choice in
AsyncStorage under `@app_theme_v1`, and pushes the result into NativeWind via
`setColorScheme`. It respects the OS setting by default.

**Theme preference is not stored server-side.** No backend change is needed for
this work.

**But almost nothing reads a token.** `tailwind.config.js` declares a dark
palette (`dark-page`, `dark-surface`, `dark-elevated`, `dark-border`,
`dark-text`, `dark-muted`), and `darkMode: "class"` is set — yet components
don't use `dark:` variants at all. They branch on `isDark` and write the hex
inline:

```tsx
className={`... ${isDark ? "bg-[#1a1c1d] border-[#34363a]" : "bg-white border-border"}`}
```

### Leak points, counted

| Raw hex | Occurrences | What it's standing in for |
|---|---:|---|
| `#f0f1f2` | 416 | primary text (**not** the declared `dark-text` `#f5f5f5`) |
| `#c6c5cf` | 272 | secondary text |
| `#46464e` | 197 | borders |
| `#1a1c1d` | 190 | page **and** card |
| `#2f3132` | 171 | elevated surface |
| `#8f9195` | 42 | third text tier (added recently, not a token) |
| `#f5f5f5` | 40 | primary text, the other one |
| `#6b6d71` | 5 | fourth text tier |

**1,333 raw hex occurrences across 93 files**, against **371** uses of the
declared tokens — literals outnumber tokens roughly 3.6 : 1.

Two consequences worth naming:

- **There are two "primary text" values in circulation** — `#f0f1f2` (416) and
  `#f5f5f5` (40) — and the token points at the less-used one.
- **Borders have splintered into eight values.** `#46464e` (160), then
  `#2f3132`, `#f0f1f2`, `#34363a`, `#e8e4e2`, `#784637`, `#fdf0eb`, `#ba1a1a`.
  `#34363a` and `#784637` exist nowhere in the config.

## 2. Surfaces

**Page and card are the same colour.** The feed screen root is `#1a1c1d`
(`app/(tabs)/index.tsx:487`) and `FeedPostCard` draws its card as
`bg-[#1a1c1d]` (`components/FeedPostCard.tsx:128`). A post is separated from the
page by a 1px `#34363a` hairline and nothing else.

`dark-page` (`#0b0b0c`) is declared and used **twice** in the whole codebase, so
the intended three-step scale collapsed to two in practice: `#1a1c1d` for
page-and-card, `#2f3132` for everything raised.

Measured separation:

- page `#1a1c1d` → card `#2f3132`: **1.31 : 1**
- `#0b0b0c` → `#1a1c1d`: **1.15 : 1**

## 3. Contrast (WCAG 2.1)

Computed with the standard relative-luminance formula against the surfaces these
colours are actually drawn on.

| Foreground | On | Ratio | Needs | |
|---|---|---:|---:|---|
| `#f0f1f2` primary text | page `#1a1c1d` | 15.12 | 4.5 | pass |
| `#f0f1f2` primary text | card `#2f3132` | 11.56 | 4.5 | pass |
| `#f5f5f5` `dark-text` | page | 15.69 | 4.5 | pass |
| `#c6c5cf` secondary | page | 10.01 | 4.5 | pass |
| `#c6c5cf` secondary | card | 7.65 | 4.5 | pass |
| `#8f9195` muted | page | 5.42 | 4.5 | pass |
| **`#8f9195` muted** | **card `#2f3132`** | **4.14** | 4.5 | **FAIL** |
| **`#6b6d71`** | page | **3.30** | 4.5 | **FAIL** |
| **`#71717A` `tertiary`** | page | **3.54** | 4.5 | **FAIL** |
| `#E94C2A` brand | page | 4.51 | 4.5 | pass, by 0.01 |
| **`#E94C2A` brand** | **card** | **3.44** | 4.5 | **FAIL** |
| **`#FFFFFF` on brand** | `#E94C2A` | **3.80** | 4.5 | **FAIL** |
| **`#178b1f` success** | page | **3.87** | 4.5 | **FAIL** |
| **`#ba1a1a` error** | page | **2.65** | 4.5 | **FAIL** |
| `#46464e` border | page | 1.83 | 3.0 | see note |
| `#27272a` `dark-border` | page | 1.15 | 3.0 | see note |

**Nine failing pairs.**

Three of them are worth calling out specifically:

- **White on brand orange is 3.80 : 1 and fails in *both* themes.** Every primary
  button in the app — "Add to cart", "Checkout", "Pay now" — has failing label
  contrast today. This is not a dark-mode-only defect.
- **The brand only passes on the page by 0.01.** `#E94C2A` on `#1a1c1d` is
  4.51 : 1. Any surface even slightly lighter fails, which is exactly what
  happens on cards (3.44).
- **`#8f9195` fails on raised surfaces.** I introduced this tier in the recent UI
  pass for secondary text; it holds on the page and breaks on cards.

**Note on the border rows:** 1.4.11 requires 3:1 for *non-text contrast that
identifies a control*. A hairline divider between list rows is decorative — it
doesn't identify anything actionable — so I'm not counting these as AA failures.
They are recorded because the real problem is different: `#46464e` is an opaque
grey block that reads as a drawn line rather than an edge, and it's the same
weight whether it separates two rows or two sections.

## 4. Media backgrounds

Image containers use `bg-[#2f3132]` (the elevated token) while the card behind
them is `#1a1c1d`, so a letterboxed or still-loading image sits on a lighter
patch than the card it's inside — `components/FeedProductCard.tsx:191`. Same for
the "No image" placeholder and the skeleton.

## 5. The floating blue settings gear

**It is not rendered by this app.** Evidence:

- There is **no blue anywhere in the palette** — `tailwind.config.js` is orange,
  black, greys, plus red/green semantics.
- No absolutely-positioned circular button exists in `components/` or `app/`.
- The `Settings` icon is imported in exactly two places, both as a list-row icon:
  `NavDrawer.tsx:274` and `app/(tabs)/profile.tsx:11`.
- `expo-dev-client`, `expo-dev-launcher` and `expo-dev-menu` are **not
  installed**, so it isn't the Expo dev overlay either.
- It moves position between screenshots and appears over iOS *and* Android
  captures.

That points to a device-level floating button — iOS AssistiveTouch, or a
screen-recording / screenshot utility. **To confirm:** take a screenshot with
Markt closed. If the gear is still there, it's the OS or another app; on iOS
check Settings → Accessibility → Touch → AssistiveTouch.

I have not "fixed" this, because there is nothing in this repo to fix. Removing
something that isn't there would have meant inventing a change and claiming it
worked.

---

## What this implies for the rebuild

1. Page and card must become distinct values, and the hairline needs to be an
   overlay rather than a grey block.
2. The brand needs a dark variant — the current one is 0.01 above the threshold
   on the page and already failing on cards.
3. White-on-orange needs addressing in both themes, not just dark.
4. The text ramp needs a fourth step that survives on raised surfaces, and
   `#6b6d71` / `#71717A` have to go.
5. Semantic success/error need dark variants; both fail badly.
6. The 1,333 literals need to become tokens, or every one of these fixes decays
   the moment someone writes another `#1a1c1d`.
