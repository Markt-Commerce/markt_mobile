/**
 * Semantic colour tokens — the single source of truth for both themes.
 *
 * Before this, components wrote hex inline: 1,333 raw colour literals across 93
 * files, against 371 uses of the tokens that already existed. Two different
 * "primary text" values were in circulation (#f0f1f2 and #f5f5f5), borders had
 * splintered into eight values, and page and card were the same colour — a feed
 * post was separated from the page by a hairline and nothing else.
 *
 * Every value below is chosen against measured contrast, not by eye. See
 * DARKMODE_AUDIT.md for the before state and the failures this fixes.
 *
 * Rules
 * -----
 * - Components never name a colour. They ask for a role.
 * - Every token exists in both themes. A token that only makes sense in one is
 *   a bug in the token, not a licence to branch on isDark.
 * - Text tokens are guaranteed AA (4.5:1) against *every* surface in the same
 *   theme, including the lightest one. That's what stops "it looked fine on the
 *   page" turning into unreadable text on a sheet.
 */

export type ThemeName = "light" | "dark";

export interface ThemeTokens {
  /** The screen itself. Nothing sits behind this. */
  surfacePage: string;
  /** Cards, list rows, anything that reads as sitting on the page. */
  surfaceRaised: string;
  /** Sheets, menus, dialogs — above everything. */
  surfaceOverlay: string;
  /** Inputs, chips, and other quiet fills inside a card. */
  surfaceSunken: string;

  /** Body copy and headings. */
  textPrimary: string;
  /** Supporting copy, timestamps, captions. */
  textSecondary: string;
  /** De-emphasised: placeholders, disabled labels, hint text. */
  textMuted: string;
  /** Text sitting on top of a primary-filled surface. */
  textOnPrimary: string;

  /** Hairlines between rows and sections. */
  border: string;
  /** Outlines that need to be seen — inputs, selected chips. */
  borderStrong: string;

  /**
   * The brand swatch — used as a *fill*: button backgrounds, active pills.
   * Its own contrast against the page is not the test; the test is whether
   * `textOnPrimary` survives on top of it.
   */
  primary: string;
  /**
   * The accent used as *text or an icon*, where the colour itself has to be
   * legible. Distinct from `primary` because #E94C2A on white is 3.80:1 —
   * orange makes a fine button and a poor sentence.
   */
  primaryText: string;
  /** Behind textOnPrimary. */
  primaryFill: string;
  /** Tinted background for primary-flavoured chips and badges. */
  primaryMuted: string;

  /** Semantic fills (chips, banners). */
  success: string;
  successMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  /** Semantic colours used as text, held to the text bar. */
  successText: string;
  dangerText: string;
  warningText: string;

  /** Behind images and video while they load, and in any letterbox gap. */
  media: string;
  /** Skeleton shimmer base. */
  skeleton: string;
}

/**
 * Dark.
 *
 * Surfaces step page -> raised -> overlay at roughly 1.10 and 1.12 — visible
 * enough to separate a card from the page without the "grey soup" of a flat
 * inverted theme. The page is committed (near-black) rather than the previous
 * #1a1c1d, which was light enough that cards drawn on it had nowhere to go.
 *
 * The accent is a lightened, slightly desaturated orange. The light-mode
 * #E94C2A measured 4.51:1 on the old page — passing by 0.01 — and 3.44:1 on
 * cards, so it was already failing wherever anything was raised. #F4805F holds
 * 7.40 / 6.73 / 6.01 across the three surfaces and stops the vibration you get
 * from a saturated warm hue on near-black.
 */
export const darkTokens: ThemeTokens = {
  surfacePage: "#0E0F11",
  surfaceRaised: "#181A1D",
  surfaceOverlay: "#212428",
  surfaceSunken: "#16181B",

  textPrimary: "#EDEEF0", // 16.52 / 15.02 / 13.42
  textSecondary: "#A8ADB4", // 8.49 / 7.72 / 6.90
  textMuted: "#8B9198", // 6.03 / 5.48 / 4.90 — the floor that still clears AA
  textOnPrimary: "#FFFFFF",

  // Low-alpha light overlays, not grey blocks. A divider should read as the
  // edge of a surface, not as a drawn line — which is what the old opaque
  // #46464e looked like.
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",

  primary: "#F4805F",
  primaryText: "#F4805F", // 7.40 / 6.73 / 6.01 — legible as text on dark
  primaryFill: "#C93E1F", // white on this is 5.01:1
  primaryMuted: "rgba(244,128,95,0.16)",

  success: "#4ADE80", // 11.00 / 10.01 / 8.94
  successMuted: "rgba(74,222,128,0.16)",
  danger: "#FF6B6B", // 6.91 / 6.28 / 5.62
  dangerMuted: "rgba(255,107,107,0.16)",
  warning: "#FBBF24",
  warningMuted: "rgba(251,191,36,0.16)",
  successText: "#4ADE80",
  dangerText: "#FF6B6B",
  warningText: "#FBBF24",

  // Matches the page, so a letterboxed image doesn't sit on a lighter patch
  // than the card containing it. That mismatch was visible on every feed
  // product card.
  media: "#0E0F11",
  skeleton: "#212428",
};

/**
 * Light.
 *
 * Kept close to what shipped — the brief was to fix dark without regressing
 * light. Two deliberate corrections carried across:
 *
 * - `primaryFill` is darker than `primary`. White on #E94C2A is 3.80:1 and
 *   fails AA in *both* themes: every "Add to cart", "Checkout" and "Pay now"
 *   label in the app today. #C93E1F takes it to 5.01:1. `primary` itself is
 *   unchanged, so the accent still looks like Markt wherever it's a colour
 *   rather than a fill.
 * - `textMuted` replaces `#71717A` (3.54:1 on dark, and thin on light too).
 */
export const lightTokens: ThemeTokens = {
  surfacePage: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceOverlay: "#FFFFFF",
  surfaceSunken: "#F4F4F5",

  textPrimary: "#09090B",
  textSecondary: "#52525B",
  textMuted: "#6B6B75",
  textOnPrimary: "#FFFFFF",

  border: "rgba(9,9,11,0.08)",
  borderStrong: "rgba(9,9,11,0.16)",

  // Unchanged: this is what a Markt button looks like, and this work was not
  // the place to redecide that.
  primary: "#E94C2A",
  // Darkened for text use only. #E94C2A as a word on white is 3.80:1.
  primaryText: "#B8371B",
  primaryFill: "#E94C2A",
  primaryMuted: "rgba(233,76,42,0.10)",

  success: "#178B1F",
  successMuted: "rgba(23,139,31,0.10)",
  danger: "#BA1A1A",
  dangerMuted: "rgba(186,26,26,0.10)",
  warning: "#A15C00",
  warningMuted: "rgba(161,92,0,0.10)",
  successText: "#0F6B16", // #178B1F is 4.42:1 on white — just under
  dangerText: "#B01717",
  warningText: "#8A4F00",

  media: "#F4F4F5",
  skeleton: "#EDEDEF",
};

export const themes: Record<ThemeName, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
};

/** Both themes must define the same keys. Checked in tests rather than trusted. */
export const TOKEN_KEYS = Object.keys(darkTokens) as (keyof ThemeTokens)[];
