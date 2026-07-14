---
name: Kinetic Minimalist
colors:
  surface: '#f9f9fa'
  surface-dim: '#dadadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeef'
  surface-container-high: '#e8e8e9'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1d'
  on-surface-variant: '#5b403b'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#8f7069'
  outline-variant: '#e3beb6'
  surface-tint: '#b52705'
  primary: '#b12403'
  on-primary: '#ffffff'
  primary-container: '#d53e1d'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a3'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5b5b64'
  on-tertiary: '#ffffff'
  tertiary-container: '#74747d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e3e1ec'
  tertiary-fixed-dim: '#c6c5cf'
  on-tertiary-fixed: '#1a1b22'
  on-tertiary-fixed-variant: '#46464e'
  background: '#f9f9fa'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e3'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-bold:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.5rem
  DEFAULT: 0.5rem
  md: 0.5rem
  lg: 0.5rem
  xl: 0.5rem
  full: 0.5rem
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system centers on a "Kinetic Minimalist" aesthetic, specifically tailored for a high-energy social e-commerce environment. It rejects corporate sterility in favor of a raw, confident, and human-centric interface. The personality is direct and transparent, fostering trust through clarity rather than decorative complexity.

By combining extreme whitespace with a high-impact primary accent, the UI directs focus toward creator content and products. The style is a hybrid of Modern Minimalism and high-contrast editorial design, creating a premium "gallery" feel where the interface recedes to let the commerce and community take center stage.

## Colors
The palette is intentionally restricted to maintain a sophisticated, editorial atmosphere. 

- **Primary (#E94C2A):** A high-vibrancy "Electric Cinnabar" used exclusively for critical actions, notifications, and brand moments. It must be used sparingly to retain its psychological impact.
- **Secondary (#000000):** Pure black serves as the foundation for typography and structural elements, providing a grounded, authoritative contrast.
- **Neutral Layers:** A range of cool-toned grays (#F4F4F5 for surfaces, #D4D4D8 for borders) ensures the interface feels breathable and prevents the "heavy" look of traditional enterprise software.
- **Background (#FFFFFF):** A stark white base maximizes the luminosity of product imagery.

## Typography
The typography system relies on a pairing of two highly technical yet legible sans-serifs. 

**Geist** is utilized for headlines and labels to provide a precise, slightly mechanical edge that feels modern and trustworthy. High-level displays use tight letter-spacing and heavy weights to create an "impact" aesthetic.

**Inter** handles all body copy and transactional text. It is chosen for its exceptional readability in data-dense e-commerce views. All body copy maintains a generous line-height to ensure the "freedom and whitespace" narrative is upheld even in text-heavy descriptions.

## Layout & Spacing
The design system employs a **Fluid Grid** model with strict vertical rhythm based on an 8px square baseline. 

- **Desktop:** A 12-column grid with 24px gutters. Content is often center-aligned with wide 64px margins to create a focused, boutique shopping experience.
- **Mobile:** A 4-column grid with 16px margins.
- **Philosophy:** "Space as a Feature." Instead of filling every pixel, the system uses the `xl` (80px) spacing token to separate major sections, forcing the user's eye to rest on featured content and products.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Low-contrast Outlines** rather than aggressive shadows.

1.  **Level 0 (Floor):** Pure white background.
2.  **Level 1 (Card/Surface):** Defined by a 1px border in a soft neutral (#E4E4E7). This keeps the UI flat and modern.
3.  **Level 2 (Interactive/Floating):** Used for menus or active cards. A very subtle, ultra-diffused shadow (0px 10px 30px rgba(0,0,0,0.04)) is applied to suggest a slight lift without breaking the minimalist aesthetic.

Avoid traditional skeuomorphism. Depth should feel like stacked sheets of premium paper.

## Shapes
The shape language is "Structured Softness." Use a consistent 8px (0.5rem) radius across all components to keep the UI cohesive and predictable.

## Components

- **Buttons:** Primary buttons are solid #000000 with white text for a high-contrast, premium look. The Primary brand color (#E94C2A) is reserved for the "Buy" or "Conversion" action only. Hover states for all buttons involve a slight translation (moving up 2px) and a color shift to a deep charcoal or the brand accent.
- **Input Fields:** Minimalist containers with 1px light gray borders. On focus, the border transitions to #000000. Labels use the `label-bold` token for clear hierarchy.
- **Cards:** Cards are border-heavy with no default shadow. They rely on the standard 8px radius. The product image always occupies the top 70% of the card area.
- **Chips/Badges:** Small, pill-shaped tags used for categories. They use a light gray background (#F4F4F5) and `label-sm` typography to remain secondary to the product name.
- **Social Feed Items:** A specialized component combining a circular avatar, Geist-weighted username, and a simplified interaction bar (Like, Comment, Share) using thin-stroke iconography.
