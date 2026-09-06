import { vars } from "nativewind";
import { themes, type ThemeName, type ThemeTokens } from "./tokens";

/**
 * The token set as inline CSS variables, for injection at the app root.
 *
 * Why this exists, when global.css already declares the same variables under
 * `@media (prefers-color-scheme: dark)`:
 *
 * NativeWind resolves that media query against its own `colorScheme`
 * observable, and `setColorScheme()` does not set that observable directly.
 * In production it only calls the native `Appearance.setColorScheme()` and
 * waits for the OS to echo an appearance-change event back
 * (react-native-css-interop/runtime/native/appearance-observables.js — the
 * synchronous `colorSchemeObservable.set` there is guarded by
 * `NODE_ENV === "test"`). So the variables update a round-trip late, and if
 * the OS is already in the scheme being set, no event fires at all and they
 * never update.
 *
 * That is the reported bug: toggling the theme moved everything drawn from
 * `useTokens()` immediately, while everything drawn from a className lagged
 * or, switching back, stayed on the old theme entirely.
 *
 * Injecting the variables from React state removes the round-trip. The
 * provider's `resolvedTheme` becomes the single source of truth for both the
 * JS tokens and the CSS variables, so the two can no longer disagree. The
 * declarations in global.css stay as the base layer for anything rendered
 * outside this subtree.
 */
export function themeVars(name: ThemeName) {
  const tokens: ThemeTokens = themes[name];
  const declarations: Record<string, string> = {};

  for (const [key, value] of Object.entries(tokens)) {
    // surfacePage -> --c-surface-page, matching theme/generate-css.mjs.
    declarations[`--c-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] =
      value;
  }

  return vars(declarations);
}
