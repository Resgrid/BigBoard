/**
 * Mock for react-native-mmkv.
 * Used in two contexts:
 *   1. Jest tests (automatic via __mocks__ directory)
 *   2. Production web builds (metro.config.js routes MMKV imports here for web)
 *
 * In browser environments (web production + jsdom) we delegate to localStorage
 * so that data survives page refreshes. In bare Node.js we fall back to an
 * in-memory map (useful for server-side or non-DOM test runners).
 */

import { useState } from 'react';

// Detect whether a real localStorage is available (browser / jsdom)
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// In-memory storage fallback (Node.js / non-DOM environments)
const inMemoryStorage: Record<string, Record<string, string>> = {};

class MockMMKV {
  private id: string;

  constructor(config?: { id?: string; encryptionKey?: string }) {
    // encryptionKey is intentionally ignored – not needed for localStorage / in-memory
    this.id = config?.id ?? 'mmkv.default';
    if (!isBrowser && !inMemoryStorage[this.id]) {
      inMemoryStorage[this.id] = {};
    }
  }

  /** Build the localStorage key for a given store key */
  private lsKey(key: string): string {
    return `mmkv.${this.id}.${key}`;
  }

  private getMemory(): Record<string, string> {
    if (!inMemoryStorage[this.id]) {
      inMemoryStorage[this.id] = {};
    }
    return inMemoryStorage[this.id];
  }

  set(key: string, value: string | number | boolean): void {
    try {
      if (isBrowser) {
        localStorage.setItem(this.lsKey(key), String(value));
      } else {
        this.getMemory()[key] = String(value);
      }
    } catch (error) {
      console.error('MMKV Mock: Failed to set value', error);
    }
  }

  getString(key: string): string | undefined {
    try {
      if (isBrowser) {
        return localStorage.getItem(this.lsKey(key)) ?? undefined;
      }
      const value = this.getMemory()[key];
      return value !== undefined ? value : undefined;
    } catch (error) {
      console.error('MMKV Mock: Failed to get string', error);
      return undefined;
    }
  }

  getNumber(key: string): number | undefined {
    try {
      const value = this.getString(key);
      if (value === undefined) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    } catch (error) {
      console.error('MMKV Mock: Failed to get number', error);
      return undefined;
    }
  }

  getBoolean(key: string): boolean | undefined {
    try {
      const value = this.getString(key);
      if (value === undefined) return undefined;
      return value === 'true';
    } catch (error) {
      console.error('MMKV Mock: Failed to get boolean', error);
      return undefined;
    }
  }

  delete(key: string): void {
    try {
      if (isBrowser) {
        localStorage.removeItem(this.lsKey(key));
      } else {
        delete this.getMemory()[key];
      }
    } catch (error) {
      console.error('MMKV Mock: Failed to delete', error);
    }
  }

  getAllKeys(): string[] {
    try {
      if (isBrowser) {
        const prefix = this.lsKey('');
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keys.push(k.slice(prefix.length));
          }
        }
        return keys;
      }
      return Object.keys(this.getMemory());
    } catch (error) {
      console.error('MMKV Mock: Failed to get all keys', error);
      return [];
    }
  }

  clearAll(): void {
    try {
      if (isBrowser) {
        const prefix = this.lsKey('');
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } else {
        const mem = this.getMemory();
        Object.keys(mem).forEach((key) => delete mem[key]);
      }
    } catch (error) {
      console.error('MMKV Mock: Failed to clear all', error);
    }
  }

  contains(key: string): boolean {
    try {
      if (isBrowser) {
        return localStorage.getItem(this.lsKey(key)) !== null;
      }
      return this.getMemory()[key] !== undefined;
    } catch (error) {
      console.error('MMKV Mock: Failed to check contains', error);
      return false;
    }
  }
}

export const MMKV = MockMMKV;

export function useMMKVString(key: string, storage: MockMMKV): [string | undefined, (value: string | undefined) => void] {
  const [value, _setValue] = useState<string | undefined>(() => storage.getString(key));

  const setValue = (newValue: string | undefined) => {
    if (newValue === undefined) {
      storage.delete(key);
    } else {
      storage.set(key, newValue);
    }
    _setValue(newValue);
  };

  return [value, setValue];
}

export function useMMKVNumber(key: string, storage: MockMMKV): [number | undefined, (value: number | undefined) => void] {
  const [value, _setValue] = useState<number | undefined>(() => storage.getNumber(key));

  const setValue = (newValue: number | undefined) => {
    if (newValue === undefined) {
      storage.delete(key);
    } else {
      storage.set(key, newValue);
    }
    _setValue(newValue);
  };

  return [value, setValue];
}

export function useMMKVBoolean(key: string, storage: MockMMKV): [boolean | undefined, (value: boolean | undefined) => void] {
  const [value, _setValue] = useState<boolean | undefined>(() => storage.getBoolean(key));

  const setValue = (newValue: boolean | undefined) => {
    if (newValue === undefined) {
      storage.delete(key);
    } else {
      storage.set(key, newValue);
    }
    _setValue(newValue);
  };

  return [value, setValue];
}

export function useMMKVObject<T>(key: string, storage: MockMMKV): [T | undefined, (value: T | undefined) => void] {
  const [value, _setValue] = useState<T | undefined>(() => {
    const stringValue = storage.getString(key);
    return stringValue ? (JSON.parse(stringValue) as T) : undefined;
  });

  const setValue = (newValue: T | undefined) => {
    if (newValue === undefined) {
      storage.delete(key);
    } else {
      storage.set(key, JSON.stringify(newValue));
    }
    _setValue(newValue);
  };

  return [value, setValue];
}
