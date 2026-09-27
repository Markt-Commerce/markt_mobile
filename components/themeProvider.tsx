import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { themeVars } from "../theme/vars";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type Ctx = {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const STORAGE_KEY = "@app_theme_v1";
const ThemeContext = createContext<Ctx | null>(null);

export const useTheme = () => {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<Resolved>(
   Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );
  const { setColorScheme } = useColorScheme();
  const system: Resolved = systemTheme;
  const resolved: Resolved = theme === "system" ? system : theme;

  useEffect(() => {
   (async () => {
     const saved = await AsyncStorage.getItem(STORAGE_KEY);
     if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
   })();
  }, []);

  useEffect(() => {
   const listener = Appearance.addChangeListener(({ colorScheme }) => {
     setSystemTheme(colorScheme === "dark" ? "dark" : "light");
   });
   return () => listener.remove();
  }, []);

  useEffect(() => {
   AsyncStorage.setItem(STORAGE_KEY, theme).catch(() => {});
  }, [theme]);

  useEffect(() => {
   setColorScheme(resolved);
  }, [resolved, setColorScheme]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      resolvedTheme: resolved,
      setTheme,
      toggle: () => setTheme((p) => (p === "dark" ? "light" : "dark")),
    }),
    [theme, resolved]
  );

  // The variables are injected here rather than left to global.css alone.
  // setColorScheme() only asks the OS to change the appearance and waits for
  // it to echo back, so className-driven colours lagged the toggle -- and when
  // the OS was already in the target scheme, no event fired and they never
  // changed at all. Driving them from `resolved` makes this provider the one
  // source of truth for both the JS tokens and the CSS variables.
  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVars(resolved)]}>{children}</View>
    </ThemeContext.Provider>
  );
};
