import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

const resolveScheme = (t: ColorSchemeType): 'light' | 'dark' => {
  if (t !== 'system') return t;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyColorScheme = (t: ColorSchemeType) => {
  // react-native-web (0.21) ships an Appearance shim with no setColorScheme, so
  // the native override path is a no-op here and calling it blindly throws.
  // Feature-detect it, then drive the class-based `dark:` variant (see
  // @custom-variant in global.css) off <html> the way the web
  // GluestackUIProvider does.
  if (typeof (Appearance as { setColorScheme?: unknown }).setColorScheme === 'function') {
    Appearance.setColorScheme(t === 'system' ? 'unspecified' : t);
  }

  if (typeof document === 'undefined') return;
  const documentElement = document.documentElement;
  if (!documentElement) return;

  const scheme = resolveScheme(t);
  documentElement.classList.remove(scheme === 'light' ? 'dark' : 'light');
  documentElement.classList.add(scheme);
  documentElement.style.colorScheme = scheme;
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
