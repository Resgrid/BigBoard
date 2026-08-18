import { useState } from 'react';
import { type StateStorage } from 'zustand/middleware';

/**
 * Web stand-in for the native MMKV instance.  It has to mirror the slice of the
 * MMKV surface the app actually calls -- getAllKeys() in particular, which the
 * cache manager uses to drop every `api_cache_*` entry when the signed-in
 * identity changes.  A missing method there throws inside an auth subscriber
 * and silently leaves the previous account's cached payloads in localStorage.
 */
const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch (e) {
    console.error('Local storage access failed', e);
    return fallback;
  }
};

export const storage: any = {
  getString: (key: string): string | undefined => safe(() => localStorage.getItem(key) ?? undefined, undefined),
  getNumber: (key: string): number | undefined =>
    safe(() => {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      const parsed = Number(raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    }, undefined),
  getBoolean: (key: string): boolean | undefined =>
    safe(() => {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      return raw === 'true' || raw === '1';
    }, undefined),
  set: (key: string, value: string | number | boolean) => safe(() => localStorage.setItem(key, String(value)), undefined),
  delete: (key: string) => safe(() => localStorage.removeItem(key), undefined),
  contains: (key: string): boolean => safe(() => localStorage.getItem(key) !== null, false),
  getAllKeys: (): string[] =>
    safe(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) keys.push(key);
      }
      return keys;
    }, []),
  clearAll: () => safe(() => localStorage.clear(), undefined),
};

const IS_FIRST_TIME = 'IS_FIRST_TIME';

export function getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    localStorage.removeItem(key);
    return null;
  }
}

export async function setItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

export async function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing from localStorage', e);
  }
}

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.error('Local storage setItem failed', e);
    }
  },
  getItem: (name) => {
    return localStorage.getItem(name);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useIsFirstTime = () => {
  // Read synchronously in the useState initializer so the very first render
  // already has the correct value.  An async useEffect approach causes a
  // false-positive "first time" flag on every page load before the effect fires.
  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    try {
      const value = localStorage.getItem(IS_FIRST_TIME);
      // null means the key was never written → genuine first-time visit
      return value === null || value === 'true';
    } catch {
      return true; // safe default if localStorage is unavailable
    }
  });

  const setFirstTime = (value: boolean | undefined) => {
    const next = value ?? true;
    try {
      if (value === undefined) {
        localStorage.removeItem(IS_FIRST_TIME);
      } else {
        localStorage.setItem(IS_FIRST_TIME, String(value));
      }
    } catch (e) {
      console.error('Error writing IS_FIRST_TIME to localStorage', e);
    }
    setIsFirstTime(next);
  };

  return [isFirstTime, setFirstTime] as const;
};
