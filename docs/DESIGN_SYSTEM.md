# Markt Design System

A single visual language for the app. All new and refactored components should follow these standards.

---

## 1. Spacing System

Base unit: **4px**. All spacing uses multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon + text) |
| `space-2` | 8px | Inline elements |
| `space-3` | 12px | Small padding |
| `space-4` | 16px | **Standard screen padding**, card padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Large section gaps |
| `space-8` | 32px | Page sections |

**Tailwind:** Use `p-4`, `px-4`, `py-3`, `gap-3`, etc. — already aligned. Standardize:
- Screen horizontal: `px-4` (16px)
- Card internal: `p-4`
- Between feed items: `gap-4` or `mb-4`
- Between sections: `mt-6`

---

## 2. Typography Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **Display** | 24px | bold (700) | 1.25 | Screen titles |
| **Title** | 20px | bold (700) | 1.3 | Section headers |
| **Body-lg** | 16px | medium (500) / semibold (600) | 1.5 | Primary body |
| **Body** | 14px | regular (400) / medium (500) | 1.5 | Secondary body |
| **Caption** | 12px | regular (400) | 1.4 | Metadata, hints |
| **Label** | 11px | semibold (600) | 1.3 | Uppercase labels |

**Tailwind mapping:**
- Display: `text-2xl font-bold`
- Title: `text-xl font-bold`
- Body-lg: `text-base font-medium` or `font-semibold`
- Body: `text-sm`
- Caption: `text-xs`
- Label: `text-[11px] font-semibold uppercase tracking-wider`

---

## 3. Color Palette

### Primary (Brand)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#e26136` | CTAs, active states, links, focus |
| `primary-muted` | `#fff6f4` | Selected background (e.g. niche visibility) |

### Neutral (Text)
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#171311` | Headings, primary body |
| `text-secondary` | `#876d64` | Captions, metadata |
| `text-muted` | `#60758a` | Placeholders, hints |

### Neutral (Surfaces)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-page` | `#ffffff` | Page background |
| `bg-muted` | `#f4f1f0` | Inputs, chips, secondary surfaces |
| `bg-elevated` | `#faf9f8` | Cards on muted (e.g. cart) |
| `border` | `#efe9e7` | Card borders, dividers |
| `border-light` | `#f3efed` | Subtle dividers |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#e9242a` | Errors, destructive |
| `success` | `#178b1f` | Success, added state |
| `error-bg` | `#ffe8e9` | Error banners |

### Dark Mode (future)
| Token | Hex |
|-------|-----|
| `bg-page-dark` | `#0b0b0c` |
| `text-primary-dark` | `#f5f5f5` |
| `border-dark` | `#27272a` |

---

## 4. Button Styles

### Primary
- Background: `primary` (#e26136)
- Text: white, `font-semibold`, `text-base`
- Height: 48px
- Padding: `px-6`
- Radius: `rounded-full`
- Disabled: `bg-muted`, `text-secondary`
- Loading: spinner + disabled

### Secondary
- Background: `bg-muted`
- Text: `text-primary`, `font-semibold`
- Same height/radius as primary

### Outline
- Border: 1px `border`
- Background: transparent
- Text: `text-primary`

### Ghost (icon buttons)
- Background: `bg-muted` when pressed
- Icon size: 22px
- Hit area: min 44x44pt

---

## 5. Input Styles

- Height: 56px (`h-14`)
- Padding: `px-4`
- Radius: `rounded-xl`
- Background: `bg-muted`
- Border: none (default); `border-2 border-error` on error
- Placeholder: `text-secondary`
- Error text: `text-error text-xs mt-1`

---

## 6. Card Patterns

### Feed / content card
- Background: white
- Border: 1px `border`
- Radius: `rounded-2xl`
- Padding: `p-4`
- Shadow: none (flat) or very subtle for elevated feel

### List row
- Border-bottom: 1px `border-light`
- Padding: `py-4 px-4`
- No rounded corners unless standalone

---

## 7. Icon Usage

- Size: 18–24px for inline; 20px standard
- Color: `text-secondary` for passive; `primary` for active/CTA
- Use `lucide-react-native` consistently
- Ensure 44x44pt hit area for icon-only buttons (`p-2` + `hitSlop`)

---

## 8. Motion Principles

- Duration: 120–200ms for micro-interactions
- Easing: ease-out for enter; ease-in for exit
- Use `react-native-reanimated` for complex animations
- Like button: scale + fill (optional)
- Toast: slide-up + fade (already implemented)

---

## 9. Accessibility Standards

- Minimum touch target: 44x44pt
- Contrast: 4.5:1 for body text; 3:1 for large text
- All icon buttons: `accessibilityLabel`
- Form errors: `accessibilityLiveRegion="polite"` where applicable

---

## Implementation Notes

1. **Tailwind config:** Extend `theme` with custom colors and spacing.
2. **Button component:** Support `variant`, `loading`, `disabled`, `children`/`label`.
3. **Avoid hardcoded hex** in components; use Tailwind classes or theme tokens.
