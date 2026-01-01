import { colorScheme } from 'nativewind';

import { storage } from '../../storage';
import { loadSelectedTheme, useSelectedTheme } from '../use-selected-theme';

// Mock the storage module
jest.mock('../../storage', () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  colorScheme: {
    set: jest.fn(),
  },
  useColorScheme: () => ({
    colorScheme: 'system',
    setColorScheme: jest.fn(),
  }),
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  useMMKVString: jest.fn(() => ['system', jest.fn()]),
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedColorScheme = colorScheme as jest.Mocked<typeof colorScheme>;

describe('loadSelectedTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should load and apply saved theme from storage', () => {
    mockedStorage.getString.mockReturnValue('dark');

    loadSelectedTheme();

    expect(mockedStorage.getString).toHaveBeenCalledWith('SELECTED_THEME');
    expect(mockedColorScheme.set).toHaveBeenCalledWith('dark');
    expect(console.log).toHaveBeenCalledWith('Loading selected theme:', 'dark');
  });

  it('should handle no saved theme gracefully', () => {
    mockedStorage.getString.mockReturnValue(undefined);

    loadSelectedTheme();

    expect(mockedStorage.getString).toHaveBeenCalledWith('SELECTED_THEME');
    expect(mockedColorScheme.set).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('No custom theme found, using system default');
  });

  it('should handle storage errors gracefully', () => {
    const error = new Error('Storage error');
    mockedStorage.getString.mockImplementation(() => {
      throw error;
    });

    loadSelectedTheme();

    expect(console.error).toHaveBeenCalledWith('Failed to load selected theme:', error);
    expect(mockedColorScheme.set).not.toHaveBeenCalled();
  });

  it('should apply light theme correctly', () => {
    mockedStorage.getString.mockReturnValue('light');

    loadSelectedTheme();

    expect(mockedColorScheme.set).toHaveBeenCalledWith('light');
    expect(console.log).toHaveBeenCalledWith('Loading selected theme:', 'light');
  });

  it('should apply system theme correctly', () => {
    mockedStorage.getString.mockReturnValue('system');

    loadSelectedTheme();

    expect(mockedColorScheme.set).toHaveBeenCalledWith('system');
    expect(console.log).toHaveBeenCalledWith('Loading selected theme:', 'system');
  });
});
