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

/** For the handful of places that legitimately need to know, e.g. StatusBar
 *  style or a third-party component that only takes "light" | "dark". */
export function useThemeName() {
  return useTheme().resolvedTheme;
}

export type { ThemeTokens };
