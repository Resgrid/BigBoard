// Mock Platform first before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((specifics: any) => specifics.ios || specifics.default),
    Version: 17,
  },
}));

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
