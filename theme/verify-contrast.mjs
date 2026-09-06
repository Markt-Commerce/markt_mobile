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

  // The tick drawn inside a completed step disc. Checked because the dark
  // success swatch is a light green — a white glyph on it is 1.74:1.
  const rs = ratio(t.onSuccessFill, t.successFill);
  const oks = rs >= 4.5 || isAccepted(themeName, "onSuccessFill", "successFill");
  if (!oks) failures++;
  rows.push([themeName, "onSuccessFill", "successFill", rs, oks]);

  // The surfaces that genuinely float must be visible as such. This used to
  // assert a page/raised step in dark, on the reasoning that page === card was
  // the defect the audit found. Seeing both themes side by side showed that was
  // the wrong conclusion: light has surfaceRaised === surfacePage (#FFFFFF) and
  // separates rows with a hairline, which is what makes it read as one clean
  // surface. Forcing a step in dark only gave the same markup two different
  // design languages -- tidy hairlines in light, a stack of grey blocks on
  // black in dark. Raised now matches the page in both.
  //
  // What must still hold is that a *sheet* is distinguishable from the page it
  // covers, in both themes, and that the quiet fill behind inputs and chips is
  // distinguishable too. Those two carry real meaning; "raised" did not.
  // surfaceSunken is a fill you have to be able to see -- an input, a chip, a
  // segmented track -- so it must differ from the page in both themes.
  //
  // surfaceOverlay is deliberately not asserted here. A sheet always arrives
  // with a dimmed backdrop, and that scrim is what separates it; light keeps
  // its sheets white-on-white, which is the platform convention. Dark steps
  // its overlay up because on a near-black page the scrim alone is not enough.
  const sunkenStep = ratio(t.surfacePage, t.surfaceSunken);
  if (sunkenStep < 1.05) {
    console.log(
      `  ${themeName} page/sunken step is only ${sunkenStep.toFixed(3)} — not visible`
    );
    failures++;
  }

  // And the two themes must treat `raised` the same way, or identical markup
  // means different things in each.
  const raisedStep = ratio(t.surfacePage, t.surfaceRaised);
  if (raisedStep !== 1) {
    console.log(
      `  ${themeName} raised differs from page (${raisedStep.toFixed(3)}) — ` +
        `light and dark must agree, see the note above`
    );
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
