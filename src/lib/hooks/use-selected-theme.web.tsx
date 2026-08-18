import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const getSchemeQuery = (): MediaQueryList | null => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(DARK_SCHEME_QUERY) : null);

const resolveScheme = (t: ColorSchemeType): 'light' | 'dark' => {
  if (t !== 'system') return t;
  return getSchemeQuery()?.matches ? 'dark' : 'light';
};

const writeScheme = (scheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const documentElement = document.documentElement;
  if (!documentElement) return;

  documentElement.classList.remove(scheme === 'light' ? 'dark' : 'light');
  documentElement.classList.add(scheme);
  documentElement.style.colorScheme = scheme;
};

// 'system' resolves to whatever the OS reports *at the moment it is applied*, so following the OS
// afterwards needs a live subscription. Only one can be active at a time -- picking an explicit
// theme tears it down again.
let systemSchemeQuery: MediaQueryList | null = null;
let systemSchemeListener: ((event: MediaQueryListEvent) => void) | null = null;

const stopFollowingSystemScheme = () => {
  if (systemSchemeQuery && systemSchemeListener) {
    if (typeof systemSchemeQuery.removeEventListener === 'function') {
      systemSchemeQuery.removeEventListener('change', systemSchemeListener);
    } else {
      // Safari < 14 only has the deprecated listener API.
      systemSchemeQuery.removeListener(systemSchemeListener);
    }
  }

  systemSchemeQuery = null;
  systemSchemeListener = null;
};

const startFollowingSystemScheme = () => {
  const query = getSchemeQuery();
  if (!query) return;

  const listener = (event: MediaQueryListEvent) => writeScheme(event.matches ? 'dark' : 'light');

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener);
  } else {
    query.addListener(listener);
  }

  systemSchemeQuery = query;
  systemSchemeListener = listener;
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

  writeScheme(resolveScheme(t));

  stopFollowingSystemScheme();
  if (t === 'system') {
    startFollowingSystemScheme();
  }
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
