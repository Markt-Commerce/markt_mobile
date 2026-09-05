/**
 * Asserts the contrast guarantees the token file claims.
 *
 *   node theme/verify-contrast.mjs
 *
 * Reads theme/tokens.ts directly rather than duplicating the values, so it
 * cannot drift from what ships. Exits non-zero on any failure, so it can gate
 * a change to the palette.
 *
 * The rule being enforced: every text token must clear AA (4.5:1) against
 * *every* surface in its own theme — not just the page. Text that passes on the
 * page and fails on a sheet is the failure mode this is here to prevent, and
 * it's exactly what #8f9195 did (5.42 on page, 4.14 on cards).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "tokens.ts"), "utf8");

function parseTheme(name) {
  const start = src.indexOf(`export const ${name}: ThemeTokens = {`);
  if (start === -1) throw new Error(`${name} not found in tokens.ts`);
  const body = src.slice(start, src.indexOf("\n};", start));
  const out = {};
  for (const m of body.matchAll(/^\s{2}(\w+):\s*"([^"]+)"/gm)) out[m[1]] = m[2];
  return out;
}

const channels = (hex) => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (hex) => { const [r, g, b] = channels(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const SURFACES = ["surfacePage", "surfaceRaised", "surfaceOverlay", "surfaceSunken"];
const TEXT = ["textPrimary", "textSecondary", "textMuted"];
// Only the *text* variants are held to the text bar. `primary`, `success` and
// friends are fills — a fill's own contrast against the page is not the test;
// the test is whether the label on top of it survives, checked separately.
const ACCENTS = ["primaryText", "successText", "dangerText", "warningText"];

/**
 * Known, deliberate exceptions.
 *
 * These are real failures. They are listed rather than fixed because fixing
 * them means changing what the brand looks like, which is not a decision to
 * make inside a dark-mode task. Each one names the fix so it is a one-line
 * change when someone decides to take it.
 */
const ACCEPTED = [
  {
    theme: "light",
    fg: "textOnPrimary",
    bg: "primaryFill",
    why: "White on #E94C2A is 3.80:1 — every primary button label in the app, " +
      "and it already failed before this work. Fix is lightTokens.primaryFill " +
      "= '#C93E1F' (5.01:1), which visibly darkens every button in light mode. " +
      "That is a brand call, not a theming one.",
  },
];
const isAccepted = (theme, fg, bg) =>
  ACCEPTED.some((a) => a.theme === theme && a.fg === fg && a.bg === bg);

let failures = 0;
const rows = [];

for (const themeName of ["light", "dark"]) {
  const t = parseTheme(themeName === "dark" ? "darkTokens" : "lightTokens");

  for (const fg of [...TEXT, ...ACCENTS]) {
    for (const bg of SURFACES) {
      const r = ratio(t[fg], t[bg]);
      const ok = r >= 4.5 || isAccepted(themeName, fg, bg);
      if (!ok) failures++;
      rows.push([themeName, fg, bg, r, ok]);
    }
  }

  // The label that sits on a filled primary button, in both themes.
  const r = ratio(t.textOnPrimary, t.primaryFill);
  const ok = r >= 4.5 || isAccepted(themeName, "textOnPrimary", "primaryFill");
  if (!ok) failures++;
  rows.push([themeName, "textOnPrimary", "primaryFill", r, ok]);

  // Surfaces must actually differ, or "elevation" is a fiction.
  const step = ratio(t.surfacePage, t.surfaceRaised);
  if (themeName === "dark" && step < 1.05) {
    console.log(`  dark page/raised step is only ${step.toFixed(3)} — not a visible elevation`);
    failures++;
  }
}

const failed = rows.filter(([, , , , ok]) => !ok);
if (failed.length) {
  console.log("FAILURES\n");
  for (const [th, fg, bg, r] of failed) {
    console.log(`  ${th.padEnd(5)} ${fg.padEnd(16)} on ${bg.padEnd(16)} ${r.toFixed(2)}  (needs 4.5)`);
  }
  console.log("");
}

const dark = parseTheme("darkTokens");
console.log(`dark surfaces: page ${dark.surfacePage} -> raised ${dark.surfaceRaised} ` +
  `(${ratio(dark.surfacePage, dark.surfaceRaised).toFixed(3)}) -> overlay ${dark.surfaceOverlay} ` +
  `(${ratio(dark.surfaceRaised, dark.surfaceOverlay).toFixed(3)})`);
if (ACCEPTED.length) {
  console.log("\nKNOWN EXCEPTIONS (real failures, deliberately not fixed here)");
  for (const a of ACCEPTED) {
    const t = parseTheme(a.theme === "dark" ? "darkTokens" : "lightTokens");
    console.log(`  ${a.theme} ${a.fg} on ${a.bg}: ${ratio(t[a.fg], t[a.bg]).toFixed(2)}`);
    console.log(`    ${a.why}`);
  }
}

console.log(`\n${rows.length} pairs checked, ${failures} unexpected failure(s), ` +
  `${ACCEPTED.length} known exception(s)`);
process.exit(failures ? 1 : 0);
