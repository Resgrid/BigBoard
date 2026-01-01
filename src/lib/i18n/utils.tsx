import type TranslateOptions from 'i18next';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback } from 'react';
import { I18nManager, Platform } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { getItem } from '@/lib/storage';

import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = () => getItem<string>(LOCAL); // 'Marc' getItem<Language | undefined>(LOCAL);

export const translate = memoize(
  (key: TxKeyPath, options = undefined) => i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) => (options ? key + JSON.stringify(options) : key)
);

export const changeLanguage = (lang: Language) => {
  const currentLanguage = i18n.language;
  const currentRTL = I18nManager.isRTL;

  // Only proceed if language is actually changing
  if (currentLanguage === lang) {
    return;
  }

  i18n.changeLanguage(lang);

  const newRTL = lang === 'ar';

  // Only restart if RTL direction is changing and we're not in web
  if (currentRTL !== newRTL && Platform.OS !== 'web') {
    if (newRTL) {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }

    // Only restart the app if RTL direction actually changed
    // This prevents unnecessary reloads when switching between LTR languages
    if (!__DEV__) {
      RNRestart.restart();
    }
    // In development, we'll let the developer manually reload if needed
    // This prevents random reloads during development
  } else if (Platform.OS === 'web') {
    // For web, we still need to reload for RTL changes
    if (currentRTL !== newRTL) {
      window.location.reload();
    }
  }
};

export const useSelectedLanguage = () => {
  const [language, setLang] = useMMKVString(LOCAL);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      if (lang !== undefined) changeLanguage(lang as Language);
    },
    [setLang]
  );

  return { language: language as Language, setLanguage };
};
