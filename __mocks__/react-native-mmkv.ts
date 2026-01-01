/**
 * Mock for react-native-mmkv on web platform
 * Uses localStorage as a fallback storage mechanism
 */

import { useState } from 'react';

class MockMMKV {
  private storage: Storage;
  private prefix: string;

  constructor(config?: { id?: string; encryptionKey?: string }) {
    this.storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
    this.prefix = config?.id || 'mmkv';
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set(key: string, value: string | number | boolean): void {
    try {
      this.storage.setItem(this.getKey(key), String(value));
    } catch (error) {
      console.error('MMKV Mock: Failed to set value', error);
    }
  }

  getString(key: string): string | undefined {
    try {
      const value = this.storage.getItem(this.getKey(key));
      return value !== null ? value : undefined;
    } catch (error) {
      console.error('MMKV Mock: Failed to get string', error);
      return undefined;
    }
  }

  getNumber(key: string): number | undefined {
    try {
      const value = this.storage.getItem(this.getKey(key));
      if (value === null) return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    } catch (error) {
      console.error('MMKV Mock: Failed to get number', error);
      return undefined;
    }
  }

  getBoolean(key: string): boolean | undefined {
    try {
      const value = this.storage.getItem(this.getKey(key));
      if (value === null) return undefined;
      return value === 'true';
    } catch (error) {
      console.error('MMKV Mock: Failed to get boolean', error);
      return undefined;
    }
  }

  delete(key: string): void {
    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('MMKV Mock: Failed to delete', error);
    }
  }

  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(`${this.prefix}:`)) {
          keys.push(key.substring(this.prefix.length + 1));
        }
      }
      return keys;
    } catch (error) {
      console.error('MMKV Mock: Failed to get all keys', error);
      return [];
    }
  }

  clearAll(): void {
    try {
      const keysToDelete = this.getAllKeys();
      keysToDelete.forEach((key) => this.delete(key));
    } catch (error) {
      console.error('MMKV Mock: Failed to clear all', error);
    }
  }

  contains(key: string): boolean {
    try {
      return this.storage.getItem(this.getKey(key)) !== null;
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
