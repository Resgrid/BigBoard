import { colorScheme, useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

export const useSelectedTheme = () => {
  const { colorScheme: _color, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ColorSchemeType | undefined>(undefined);

  useEffect(() => {
    const storedTheme = localStorage.getItem(SELECTED_THEME);
    if (storedTheme) {
      setThemeState(storedTheme as ColorSchemeType);
    }
  }, []);

  const setSelectedTheme = React.useCallback(
    (t: ColorSchemeType) => {
      setColorScheme(t);
      setThemeState(t);
      localStorage.setItem(SELECTED_THEME, t);
    },
    [setColorScheme]
  );

  const selectedTheme = (theme ?? 'system') as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};

export const loadSelectedTheme = () => {
  try {
    console.log('Skipping theme loading on web platform - using system default');
    return;
  } catch (error) {
    console.error('Failed to load selected theme:', error);
  }
};
