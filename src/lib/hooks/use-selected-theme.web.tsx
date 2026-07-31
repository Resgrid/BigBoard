import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

const applyColorScheme = (t: ColorSchemeType) => {
  // NativeWind v5: theme overrides go through the standard Appearance API
  // ('unspecified' clears the override so the OS preference applies again).
  Appearance.setColorScheme(t === 'system' ? 'unspecified' : t);
};

export const useSelectedTheme = () => {
  const [theme, setThemeState] = useState<ColorSchemeType | undefined>(undefined);

  useEffect(() => {
    const storedTheme = localStorage.getItem(SELECTED_THEME);
    if (storedTheme) {
      setThemeState(storedTheme as ColorSchemeType);
    }
  }, []);

  const setSelectedTheme = React.useCallback((t: ColorSchemeType) => {
    applyColorScheme(t);
    setThemeState(t);
    localStorage.setItem(SELECTED_THEME, t);
  }, []);

  const selectedTheme = (theme ?? 'dark') as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};

export const loadSelectedTheme = () => {
  try {
    const storedTheme = localStorage.getItem(SELECTED_THEME);
    if (storedTheme) {
      applyColorScheme(storedTheme as ColorSchemeType);
    } else {
      // Preserve the historical web default of dark mode.
      applyColorScheme('dark');
    }
  } catch (error) {
    console.error('Failed to load selected theme:', error);
  }
};
