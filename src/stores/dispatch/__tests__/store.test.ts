// Mock Platform first before any imports
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native') as object;
  const platform = {
    OS: 'ios',
    select: jest.fn((specifics: any) => specifics.ios || specifics.default),
    Version: 17,
  };
  // Proxy rather than spread: spreading react-native eagerly evaluates every lazy
  // getter on its index, which pulls in native-only modules (DevMenu) under Jest.
  return new Proxy(actual, {
    get: (target, prop) => (prop === 'Platform' ? platform : Reflect.get(target, prop)),
  });
});

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
  useMMKVBoolean: jest.fn(() => [false, jest.fn()]),
}));

import { renderHook } from '@testing-library/react-native';
import { useDispatchStore } from '../store';

describe('useDispatchStore', () => {
  it('should initialize without errors', () => {
    const { result } = renderHook(() => useDispatchStore());
    expect(result.current).toBeDefined();
  });

  it('should have basic properties', () => {
    const { result } = renderHook(() => useDispatchStore());
    expect(typeof result.current).toBe('object');
  });
});
