#!/usr/bin/env node
/**
 * Asserts that every theme token actually reaches the app with BOTH a light
 * and a dark value.
 *
 * This exists because the other checks all passed while dark mode was visibly
 * broken on device. `global.css` contained the right hex, the contrast
 * verifier was happy, and tsc was clean — but the dark block was written with
 * a class selector, and react-native-css-interop silently compiled it to an
 * ordinary class rule instead of root variables. Every `var()` resolved to its
 * light value at runtime while `useTokens()` returned dark, which is how the
 * drawer ended up with black labels on a dark background.
 *
 * Checking the CSS text could never have caught that. This runs the real
 * compiler — the same `cssToReactNativeRuntime` NativeWind's metro transform
 * uses — over the real built stylesheet, and looks at what the app would
 * actually receive.
 *
 *   node theme/verify-runtime-vars.mjs
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "/"));
const { cssToReactNativeRuntime } = require("react-native-css-interop/dist/css-to-rn");

const root = new URL("..", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "markt-theme-"));
const built = join(tmp, "built.css");

try {
  // Build exactly as the app does: the Tailwind config carries the NativeWind
  // preset, so this is the stylesheet metro would hand to the compiler.
  execFileSync(
    "npx",
    ["tailwindcss", "-i", join(root, "global.css"), "-o", built],
    { cwd: root, stdio: "pipe" }
  );

  const compiled = cssToReactNativeRuntime(readFileSync(built));
  const vars = compiled.rootVariables ?? {};
  const names = Object.keys(vars).filter((n) => n.startsWith("--c-"));

  if (names.length === 0) {
    console.error("No --c-* root variables reached the runtime at all.");
    console.error("The theme is not being applied. Check theme/generate-css.mjs.");
    process.exit(1);
  }

  const missingDark = names.filter((n) => vars[n].dark === undefined);
  const missingLight = names.filter((n) => vars[n].light === undefined);

  for (const n of missingLight) console.error(`${n}: no light value at runtime`);
  for (const n of missingDark) {
    console.error(`${n}: no DARK value at runtime (light is ${vars[n].light})`);
  }

  if (missingDark.length || missingLight.length) {
    console.error(
      `\n${missingDark.length + missingLight.length} token(s) would resolve to` +
        ` the wrong theme on device.\n` +
        `The dark block in global.css must be \`:root\` inside\n` +
        `\`@media (prefers-color-scheme: dark)\`. A \`.dark\` or \`.dark:root\`\n` +
        `selector compiles to an ordinary class rule — NativeWind never sets\n` +
        `the compiler's darkMode:"class" option, so that branch is unreachable.`
    );
    process.exit(1);
  }

  // theme/vars.ts injects these same names from React state. If a token is
  // renamed and only one side is updated, the injection silently sets
  // variables nothing reads — the theme would then lag the toggle again with
  // every check still green.
  const tokensSrc = readFileSync(join(root, "theme/tokens.ts"), "utf8");
  const block = tokensSrc.match(/export const darkTokens[^{]*\{([\s\S]*?)\n\};/);
  if (!block) {
    console.error("Could not read darkTokens from theme/tokens.ts.");
    process.exit(1);
  }
  const injected = [...block[1].matchAll(/^\s{2}([a-zA-Z]+):/gm)].map(
    (m) => `--c-${m[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
  );
  const declared = new Set(
    (readFileSync(join(root, "global.css"), "utf8").match(/--c-[a-z-]+(?=:)/g) ?? [])
  );
  const orphans = injected.filter((n) => !declared.has(n));
  if (orphans.length) {
    console.error("Injected variable names that global.css never declares:");
    for (const n of orphans) console.error(`  ${n}`);
    console.error(
      "\ntheme/vars.ts and theme/generate-css.mjs must produce the same names." +
        "\nRun 'npm run theme:css' after renaming a token."
    );
    process.exit(1);
  }

  console.log(
    `${names.length} theme variables reach the runtime with both light and ` +
      `dark values; ${injected.length} injected names match global.css.`
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
