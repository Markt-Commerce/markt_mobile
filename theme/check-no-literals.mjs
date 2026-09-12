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
  // Google's four-colour "G" is a trademark. Google's identity guidelines
  // require the mark be reproduced exactly; theming it would be both wrong and
  // a brand violation. The spinner overlay on Apple's own button is likewise
  // pinned to contrast with Apple's fixed BLACK/WHITE button styles, which do
  // not follow our tokens.
  "components/auth/SocialAuthButtons.tsx": [
    "#4285F4", "#34A853", "#FBBC05", "#EA4335", "#000000", "#FFFFFF",
  ],
  // Star gold, which is what a rating star looks like everywhere.
  "components/StarRating.tsx": ["#F5A623"],
  "components/gamification/TierBadge.tsx": ["#F5A623"],
};

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/**
 * Palette names that are a fixed hex in tailwind.config.js and therefore do
 * not follow the theme. Using one unconditionally is the same bug as writing
 * the hex: `text-secondary` is #000000, so it is black text on a dark page.
 *
 * Matched as whole class tokens, so `text-text-secondary` (a real token) is
 * never confused with `text-secondary` (a fixed value).
 */
const THEME_BLIND = [
  "secondary",
  "surface",
  "surface-dim",
  "background",
  "tertiary",
  "bg-muted",
  "bg-elevated",
  "border-light",
  "error",
  "error-bg",
];
const BLIND_RE = new RegExp(
  `(?<![\\w-])(?:bg|text|border)-(?:${THEME_BLIND.join("|")})(?![\\w-])`,
  "g"
);

/**
 * `useTokens()` is a hook, so it must be called unconditionally at the top of
 * a component. Writing it inline — `hasImage ? useTokens().media : bg` — makes
 * the hook count change between renders, and React throws "Rendered more hooks
 * than during the previous render". It shipped exactly once, in Avatar, and
 * crashed the tab bar on launch.
 *
 * tsc cannot see this and there is no ESLint in this repo, so the mechanical
 * migration had nothing stopping it. The rule here is narrow on purpose: the
 * call must be its own `const x = useTokens();` statement. `tokensFor()` is a
 * plain function, not a hook, and is unrestricted.
 */
/**
 * react-native's own SafeAreaView is iOS-only and has no NativeWind mapping,
 * so a `className` on it is silently dropped — the search screen's
 * `bg-surface-page` did nothing and the navigator's light background showed
 * through in dark mode. Every other screen imports it from
 * react-native-safe-area-context.
 */
const RN_SAFE_AREA =
  /import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*["']react-native["']/s;

const HOOK_CALL = /useTokens\s*\(/;
const HOOK_BINDING = /^\s*const\s+\w+\s*=\s*useTokens\(\);?\s*$/;

/** What to use instead, named in the failure message. */
const BLIND_FIX = {
  secondary: "text-text-primary / bg-text-primary",
  surface: "bg-surface-sunken",
  "surface-dim": "bg-surface-sunken",
  background: "bg-surface-raised",
  tertiary: "text-text-muted",
  "bg-muted": "bg-surface-sunken",
  "bg-elevated": "bg-surface-raised",
  "border-light": "border-border",
  error: "danger (text-danger-text / bg-danger / border-danger)",
  "error-bg": "bg-danger-muted",
};

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

    if (RN_SAFE_AREA.test(src)) {
      console.error(`${rel}: imports SafeAreaView from "react-native"`);
      console.error(
        '    it has no NativeWind mapping, so className is ignored — import it' +
          ' from "react-native-safe-area-context"'
      );
      failures++;
    }

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

      if (HOOK_CALL.test(line) && !HOOK_BINDING.test(line)) {
        console.error(`${rel}:${i + 1}: useTokens() must be its own statement`);
        console.error(`    ${line.trim()}`);
        console.error(
          "    a hook cannot be called conditionally — bind it at the top of" +
            " the component:  const t = useTokens();"
        );
        failures++;
      }

      for (const match of line.match(BLIND_RE) ?? []) {
        const name = match.replace(/^(bg|text|border)-/, "");
        console.error(`${rel}:${i + 1}: ${match} is a fixed light-mode colour`);
        console.error(`    use ${BLIND_FIX[name] ?? "a semantic token"}`);
        failures++;
      }
    });
  }
}

if (failures) {
  console.error(
    `\n${failures} theme problem(s) — see each line above for the fix.` +
      `\n  className: bg-surface-raised, text-text-secondary, border-border, ...` +
      `\n  props:     const t = useTokens();  color={t.textSecondary}` +
      `\nIf a colour really is theme-independent, add it to ALLOWED in this` +
      `\nfile with the reason.`
  );
  process.exit(1);
}
console.log("No raw colour literals or theme-blind classes in app/ or components/.");
