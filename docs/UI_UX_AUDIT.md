# Markt UI/UX Audit

**Date:** February 8, 2025  
**Benchmarks:** Chowdeck, Twitter/X, Reddit  
**Scope:** Layout, hierarchy, components, feed, forms, empty/loading states, accessibility

---

## Executive Summary

Markt has a solid foundation with a warm, earthy palette and card-based layouts. The app blends ecommerce (product cards, cart), social (posts, likes, comments), and community (niches, buyer requests). Several inconsistencies and missed opportunities prevent it from reaching Chowdeck-level polish and Twitter/Reddit-level feed ergonomics.

---

## 1. Layout Structure & Spacing

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Inconsistent padding** | Mix of `px-4`, `px-5`, `py-2`, `py-3`, `py-4`, `py-6` without a system | Screen edges feel arbitrary; content doesn't breathe consistently | Use a spacing scale (4, 8, 12, 16, 24, 32) and apply consistently |
| **Feed card spacing** | `pt-3` on each card; no clear gap between sections | Dense, cluttered feel; hard to parse content blocks | Add consistent vertical rhythm (e.g. 16px between feed items) |
| **Profile/Settings layout** | `DetermineSwitchType` button has no margin; sections touch edges | Feels cramped; CTA competes with surrounding content | Add horizontal padding and vertical margin around primary CTAs |

---

## 2. Visual Hierarchy & Typography

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **No typography scale** | Ad-hoc sizes: `text-xs`–`text-2xl`, `font-extrabold` vs `font-bold` vs `font-semibold` | Inconsistent emphasis; unclear hierarchy | Define 5–6 levels: display, title, body-lg, body, caption, label |
| **Header weights** | "Marketplace" uses `font-extrabold`; others use `font-bold` | Inconsistent screen dominance | Use one weight for primary headers (e.g. bold) across app |
| **Caption/secondary text** | Mix of `#876d64`, `#60758a`, `#826869`, `#5f4f4f` | Feels disjointed; no semantic meaning | One secondary color; optionally one muted color |

---

## 3. Color Usage & Contrast

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Primary color split** | `#e26136`, `#e9242a`, `#E94C2A` used interchangeably | Brand feels inconsistent; users can't learn one CTA pattern | Single primary accent (e.g. `#e26136`) for all CTAs |
| **Icon colors** | Action icons use `#60758a` (blue-gray) | Disconnects from warm brand; feels like a different app | Use brand-aligned secondary (e.g. warm gray or primary) |
| **Tab bar** | Hardcoded white bg, `#171311` active, `#876d64` inactive | Doesn't adapt to dark mode; low contrast for inactive | Use theme-aware colors; ensure 4.5:1 contrast for labels |

---

## 4. Component Consistency

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Button component** | Fixed text "Next"; ignores `text` prop in some flows; uses `#e9242a` | Not reusable; login shows "Login" but Button still says "Next" internally (partially fixed) | Variants: primary, secondary, outline; accept children or `label` prop |
| **Card borders** | Mix of `border-[#efe9e7]`, `border-[#e5dedc]`, `border-[#eee]` | Visual noise; cards don't feel unified | Single border token (e.g. `border-muted`) |
| **Empty states** | Plain text only; no illustration or icon | Feels unfinished; low guidance | Add icon/illustration + clear CTA + helpful copy |

---

## 5. Button & Interaction Affordances

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **No hover/active feedback** | `activeOpacity` used inconsistently | Touch targets feel unresponsive | Consistent `activeOpacity={0.7}` on all TouchableOpacity |
| **Disabled state** | Button uses gray bg; no loading spinner | Unclear if action is in progress or blocked | Distinguish: disabled = gray; loading = spinner + disabled |
| **Small hit targets** | Icon buttons ~44px; some smaller | Hard to tap on mobile | Minimum 44x44pt for interactive elements |

---

## 6. Navigation Clarity

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Tab labels hidden** | `tabBarShowLabel: false` | New users don't know what each icon means | Show labels (like Chowdeck/Twitter) or use tooltips |
| **Role-based tabs** | Buyer/seller see different tabs; no visual cue | Confusing when switching roles | Consider badge or subtle indicator for role context |
| **Header back button** | Inconsistent placement (left vs center) | Inconsistent muscle memory | Standard: back left, title center, actions right |

---

## 7. Feed Readability & Density

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **No section headers** | Products, posts, requests mixed without dividers | Hard to scan; content blends together | Optional section labels (e.g. "Products", "Posts") or clear visual breaks |
| **Post card density** | Single image; caption + actions in one block | Adequate but could be tighter (Twitter-style) | Consider avatar + single-line metadata; tighter line-height |
| **Product grid** | 2 columns; good. But Add/Chat buttons small | Secondary actions easy to miss | Slightly larger touch targets; consider icon-only with tooltip |

---

## 8. Form UX & Input Ergonomics

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Input height** | `h-14` (56px) — good | — | Keep; matches Chowdeck-style inputs |
| **Error state** | Red text below; no border change | Errors easy to miss | Add `border-error` on invalid; ensure error message is announced |
| **Placeholder color** | `#826869` vs `#876d64` in different inputs | Inconsistent feel | Single placeholder color token |

---

## 9. Micro-interactions & Transitions

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **No page transitions** | Stack screens snap in | Feels abrupt | Expo Router supports transitions; add subtle slide |
| **Like button** | No fill animation | Missed delight moment | Heart fill animation on like (common in social apps) |
| **Toast** | Slide-up + fade; good | — | Keep; consider optional haptic on show |

---

## 10. Empty States & Loading States

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Empty feed** | "No items yet" + "Pull up to load" | Vague; no illustration | Add icon; "Start by adding a product or post"; CTA to create |
| **Empty cart** | Generic empty box + "Start shopping" | Works but feels cold | Consider illustration; warmer copy |
| **Empty messages** | "No messages" only | No guidance | "Start a conversation" + CTA to browse sellers |
| **Loading** | `ActivityIndicator` only | Feels basic | Skeleton loaders for cards (Chowdeck/Twitter style) |

---

## 11. Accessibility

| Issue | What's wrong | Why it hurts | Best practice |
|-------|--------------|--------------|---------------|
| **Missing labels** | Icon-only buttons (Plus, Bell) | Screen readers can't describe | `accessibilityLabel` on all icon buttons |
| **Contrast** | Secondary text `#876d64` on white ~4.5:1 | May fail WCAG AA for small text | Verify contrast; use slightly darker if needed |
| **Focus order** | Not audited | — | Ensure logical tab order in forms |

---

## 12. Brand Alignment

**Current brand essence (from audit):**
- Warm, earthy palette (terracotta `#e26136`, warm grays)
- Card-based, rounded layouts (`rounded-2xl`)
- Clean, minimal aesthetic

**Recommendation:** Unify primary accent to `#e26136` and remove `#e9242a`/`#E94C2A` from primary CTAs. Use the warmer palette consistently.

---

## Priority Matrix

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| P0 | Unify primary color | High | Low |
| P0 | Button component (variants, props) | High | Low |
| P0 | Spacing system + tailwind tokens | High | Medium |
| P1 | Tab bar labels | Medium | Low |
| P1 | Empty states (icon + CTA) | Medium | Medium |
| P1 | Input error states | Medium | Low |
| P2 | Skeleton loaders | Medium | Medium |
| P2 | Accessibility labels | High (a11y) | Low |
| P2 | Like animation | Low | Medium |

---

*Next: See `DESIGN_SYSTEM.md` for refinement guidelines and implementation.*
