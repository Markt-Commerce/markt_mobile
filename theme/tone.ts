/**
 * Status tone -> chip classes.
 *
 * An order status is scanned, not read: green means it's fine, amber means it
 * wants attention, red means it went wrong. That mapping was duplicated in
 * three files as `Record<string, [light, dark]>` tuples indexed by
 * `[isDark ? 1 : 0]`, with twelve hand-mixed hex values behind it and two
 * different names for the same thing (TONE_* and STATUS_*).
 *
 * The semantic tokens already express all of it, and they resolve per theme on
 * their own — so there is no tuple and no theme index here, and the chips are
 * held to the same measured contrast as the rest of the app.
 */
export type Tone = "positive" | "attention" | "negative" | "neutral";

export const TONE_BG: Record<Tone, string> = {
  positive: "bg-success-muted",
  attention: "bg-warning-muted",
  negative: "bg-danger-muted",
  neutral: "bg-surface-sunken",
};

export const TONE_TEXT: Record<Tone, string> = {
  positive: "text-success-text",
  attention: "text-warning-text",
  negative: "text-danger-text",
  neutral: "text-text-secondary",
};
