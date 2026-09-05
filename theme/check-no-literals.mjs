#!/usr/bin/env node
/**
 * Fails if a raw colour literal reappears in app/ or components/.
 *
 * The audit counted 1,333 of these across 93 files. Every fix in the token
 * system decays the moment someone writes another `bg-[#1a1c1d]`, so this is
 * the thing that keeps it from happening — the same idea as the backend's
 * scripts/check_enum_drift.py.
 *
 *   node theme/check-no-literals.mjs
 *
 * Exits non-zero on any new literal. ALLOWED below is the complete list of
 * places a hex is still correct, each with the reason. Adding to it should be
 * a deliberate decision made in review, not a way to silence the check.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components"];

/**
 * Colours that are genuinely not theme-dependent. Keyed by file, listing the
 * literals allowed in it.
 */
const ALLOWED = {
  // White on the brand gradient. A deliberately single-look branded splash,
  // the same call as a video scrim: it does not restyle per theme.
  "app/introduction.tsx": ["#ffffff", "#fff"],
  // A shadow is black in both themes.
  "app/(tabs)/_layout.tsx": ["#000000"],
  // Controls drawn over video, where the backdrop is the footage rather than
  // a themed surface.
  "components/postMedia.tsx": ["#ffffff", "#000000"],
  "components/imagePicker.tsx": ["#ffffff", "#000"],

  // --- Identity palettes -------------------------------------------------
  // These are not "a colour for some UI role" — they are fixed sets where the
  // specific hue *is* the meaning. Theming them would break what they encode.

  // A deterministic avatar tint hashed from the user's name. The point is that
  // the same person is always the same colour.
  "components/Avatar.tsx": ["#e26136", "#60758a", "#178b1f", "#876d64"],
  // Same idea for niche tiles, hashed from the niche name.
  "components/discoverNichesComponent.tsx": [
    "#e26136", "#c1502b", "#a8563e", "#8a6d4f", "#6d7a52", "#4f6d6a",
  ],
  // Gold, silver and bronze. A silver medal is not "muted text".
  "components/gamification/LeaderboardRow.tsx": [
    "#F5C518", "#3F2E00", "#C9CDD2", "#2B2F33", "#D08A54", "#3A2109",
  ],
  // Star gold, which is what a rating star looks like everywhere.
  "components/StarRating.tsx": ["#F5A623"],
  "components/gamification/TierBadge.tsx": ["#F5A623"],
};

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p;
  }
}

let failures = 0;
for (const dir of DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    const allowed = (ALLOWED[rel] ?? []).map((c) => c.toLowerCase());
    const src = readFileSync(file, "utf8");

    let inBlockComment = false;
    src.split("\n").forEach((line, i) => {
      // Prose is allowed to name a colour — the token file and several
      // components explain *why* a value was chosen, and those explanations
      // are the opposite of the problem this guards against.
      const trimmed = line.trim();
      if (inBlockComment) {
        if (trimmed.includes("*/")) inBlockComment = false;
        return;
      }
      if (trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) inBlockComment = true;
        return;
      }
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

      // An alpha overlay (#ffffff11) genuinely differs per theme and has no
      // token — it is a ripple tint, not a surface.
      if (/android_ripple/.test(line)) return;
      for (const match of line.match(HEX) ?? []) {
        if (allowed.includes(match.toLowerCase())) continue;
        console.error(`${rel}:${i + 1}: raw colour ${match}`);
        console.error(`    ${line.trim()}`);
        failures++;
      }
    });
  }
}

if (failures) {
  console.error(
    `\n${failures} raw colour literal(s). Use a token from theme/tokens.ts —` +
      `\n  className: bg-surface-raised, text-text-secondary, border-border, ...` +
      `\n  props:     const t = useTokens();  color={t.textSecondary}` +
      `\nIf the colour really is theme-independent, add it to ALLOWED in this` +
      `\nfile with the reason.`
  );
  process.exit(1);
}
console.log("No raw colour literals in app/ or components/.");
