/**
 * The way a component gets colour.
 *
 * `const t = useTokens()` then `t.surfaceRaised`, `t.textSecondary`. No
 * component should contain a hex literal or branch on `isDark` to pick one —
 * that's what produced 1,333 hardcoded colours across 93 files, two competing
 * "primary text" values, and eight different border greys.
 */
import { useMemo } from "react";
import { useTheme } from "../components/themeProvider";
import { themes, type ThemeTokens } from "./tokens";

export function useTokens(): ThemeTokens {
  const { resolvedTheme } = useTheme();
  return useMemo(() => themes[resolvedTheme], [resolvedTheme]);
}

/**
 * Tokens without a hook, for code that already knows the theme.
 *
 * Several presentational sub-components take `isDark` as a prop and are written
 * as implicit-return arrows, where a hook call has nowhere to go. They still
 * shouldn't contain hex, so they resolve from the theme they were handed.
 * Prefer useTokens() anywhere a hook is possible.
 */
export function tokensFor(isDark: boolean): ThemeTokens {
  return themes[isDark ? "dark" : "light"];
}

/** For the handful of places that legitimately need to know, e.g. StatusBar
 *  style or a third-party component that only takes "light" | "dark". */
export function useThemeName() {
  return useTheme().resolvedTheme;
}

export type { ThemeTokens };
