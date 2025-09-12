// context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type Language = string;

const THEME_KEY = 'app_theme_v1';
const LANG_KEY = 'app_lang_v1';

const ThemeContext = createContext({
  theme: 'light' as Theme,
  setTheme: (t: Theme) => {},
  language: 'en' as Language,
  setLanguage: (l: Language) => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(THEME_KEY);
      const l = await AsyncStorage.getItem(LANG_KEY);
      if (t) setThemeState(t as Theme);
      if (l) setLanguageState(l);
    })();
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_KEY, t);
    // Optionally: emit event or call a callback so layout.tsx applies changes
  };

  const setLanguage = async (l: Language) => {
    setLanguageState(l);
    await AsyncStorage.setItem(LANG_KEY, l);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, language, setLanguage }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
