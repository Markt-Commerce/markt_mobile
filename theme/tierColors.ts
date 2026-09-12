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

export function tierColor(tier: string | null | undefined, t: ThemeTokens): string {
  switch ((tier ?? "").toLowerCase() as TierKey) {
    case "newcomer":
      // No colour earned yet — deliberately neutral, so arriving at Hustler is
      // the moment the badge first takes the brand on.
      return t.textMuted;
    case "hustler":
      return t.primaryMuted;
    case "trader":
      return t.primaryText;
    case "merchant":
      return t.primary;
    case "magnate":
      return t.primaryFill;
    case "mogul":
      // The deepest step. In dark mode primaryFill is already the darkest
      // brand value, so Mogul reuses it rather than inventing a seventh.
      return t.primaryFill;
    default:
      // An unknown tier is a data problem, not a reason to render nothing.
      return t.textSecondary;
  }
}
