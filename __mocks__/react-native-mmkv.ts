/**
 * Mock for react-native-mmkv on web platform
 * Uses an in-memory storage for tests
 */

import { useState } from 'react';

// In-memory storage for tests
const inMemoryStorage: Record<string, Record<string, string>> = {};

class MockMMKV {
  private storage: Record<string, string>;
  private prefix: string;

  constructor(config?: { id?: string; encryptionKey?: string }) {
    this.prefix = config?.id || 'mmkv';
    // Use in-memory storage for tests
    if (!inMemoryStorage[this.prefix]) {
      inMemoryStorage[this.prefix] = {};
    }
    this.storage = inMemoryStorage[this.prefix];
  }

  private getKey(key: string): string {
    return key;
  }

  set(key: string, value: string | number | boolean): void {
    try {
      this.storage[this.getKey(key)] = String(value);
    } catch (error) {
      console.error('MMKV Mock: Failed to set value', error);
    }
  }

  getString(key: string): string | undefined {
    try {
      const value = this.storage[this.getKey(key)];
      return value !== undefined ? value : undefined;
    } catch (error) {
      console.error('MMKV Mock: Failed to get string', error);
      return undefined;
    }
  }

  getNumber(key: string): number | undefined {
    try {
      const value = this.storage[this.getKey(key)];
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
      const value = this.storage[this.getKey(key)];
      if (value === undefined) return undefined;
      return value === 'true';
    } catch (error) {
      console.error('MMKV Mock: Failed to get boolean', error);
      return undefined;
    }
  }

  delete(key: string): void {
    try {
      delete this.storage[this.getKey(key)];
    } catch (error) {
      console.error('MMKV Mock: Failed to delete', error);
    }
  }

  getAllKeys(): string[] {
    try {
      return Object.keys(this.storage);
    } catch (error) {
      console.error('MMKV Mock: Failed to get all keys', error);
      return [];
    }
  }

  clearAll(): void {
    try {
      Object.keys(this.storage).forEach((key) => delete this.storage[key]);
    } catch (error) {
      console.error('MMKV Mock: Failed to clear all', error);
    }
  }

  contains(key: string): boolean {
    try {
      return this.storage[this.getKey(key)] !== undefined;
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
