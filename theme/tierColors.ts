import type { ThemeTokens } from "./tokens";

/**
 * A tier's colour, derived from its key and the active theme.
 *
 * Tier colours used to arrive from the server as a single `color_hex`. That
 * cannot be right in both themes — one hex has to pick a side, and the six the
 * server sent were unrelated hues anyway (slate, sienna, grey, orange, teal and
 * a vivid blue), invisible to `theme:lint` because they were data rather than
 * code. That is where the app's blue accent came from.
 *
 * The key is the durable fact; the colour is a presentation decision, so it
 * belongs here where the token system and the contrast verifier can both see
 * it. Prestige reads as increasing depth within the brand family rather than as
 * six different hues.
 */
export type TierKey =
  | "newcomer"
  | "hustler"
  | "trader"
  | "merchant"
  | "magnate"
  | "mogul";

/**
 * This is drawn as a foreground — the badge icon's stroke and the tier
 * name's text colour — so every value it returns has to be legible on
 * the surfaces the badge appears on.
 *
 * The "increasing depth within the brand family" ramp this used to
 * return did not survive that. `primaryMuted` is `rgba(...,0.16)`, a
 * background wash: Hustler's icon and label were drawn at 16% opacity
 * and were invisible in both themes, which is what was reported. And
 * `primaryFill` is #C93E1F, which is 3.83:1 on the dark page — under
 * AA — so Magnate and Mogul were failing too, just less obviously.
 * Neither was caught because the contrast verifier checked
 * `primaryText` and not the two tokens this file actually reached for.
 *
 * Dark mode has exactly one legible brand value (#F4805F), so a
 * six-step foreground ramp is not something the current palette can
 * express. Prestige is carried by the per-tier icon and the star count
 * instead, which TierBadge already draws; the colour marks the one
 * distinction that survives legibly — whether a tier has been earned
 * at all.
 *
 * A real six-colour ramp needs new brand values chosen to pass in both
 * themes, which is a brand decision rather than a theming one.
 */
export function tierColor(tier: string | null | undefined, t: ThemeTokens): string {
  switch ((tier ?? "").toLowerCase() as TierKey) {
    case "newcomer":
      // No colour earned yet — deliberately neutral, so arriving at Hustler is
      // the moment the badge first takes the brand on.
      return t.textMuted;
    case "hustler":
    case "trader":
    case "merchant":
    case "magnate":
    case "mogul":
      return t.primaryText;
    default:
      // An unknown tier is a data problem, not a reason to render nothing.
      return t.textSecondary;
  }
}

/**
 * The same colour as a background wash, for the chip behind the badge.
 *
 * TierBadge built this by appending "22" to the colour string, which
 * only ever worked while every tier returned a 6-digit hex. The moment
 * one returned an `rgba(...)` token the result was the literal string
 * "rgba(244,128,95,0.16)22" — not a colour at all, so the chip rendered
 * with no background under an invisible label.
 */
export function tierSurface(tier: string | null | undefined, t: ThemeTokens): string {
  return withAlpha(tierColor(tier, t), 0.13);
}

/** Alpha applied to a token, whatever notation the token happens to use. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Not a notation we can take apart. Returning it unchanged is wrong
  // as a wash but visible, which beats returning something invalid.
  return color;
}
