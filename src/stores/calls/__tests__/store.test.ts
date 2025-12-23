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

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getCallPriorities } from '@/api/calls/callPriorities';
import { getCalls } from '@/api/calls/calls';
import { getCallTypes } from '@/api/calls/callTypes';
import { useCallsStore } from '../store';

// Mock the API calls
jest.mock('@/api/calls/callPriorities');
jest.mock('@/api/calls/calls');
jest.mock('@/api/calls/callTypes');

const mockGetCallPriorities = getCallPriorities as jest.MockedFunction<typeof getCallPriorities>;
const mockGetCalls = getCalls as jest.MockedFunction<typeof getCalls>;
const mockGetCallTypes = getCallTypes as jest.MockedFunction<typeof getCallTypes>;

describe('useCallsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCallsStore.setState({
      calls: [],
      callPriorities: [],
      callTypes: [],
      isLoading: false,
      error: null,
    });
  });

  describe('fetchCallTypes', () => {
    it('should fetch call types when store is empty', async () => {
      const mockCallTypesData = [
        { Id: '1', Name: 'Emergency' },
        { Id: '2', Name: 'Medical' },
      ];

      mockGetCallTypes.mockResolvedValue({
        Data: mockCallTypesData,
      } as any);

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.fetchCallTypes();
      });

      await waitFor(() => {
        expect(result.current.callTypes).toEqual(mockCallTypesData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGetCallTypes).toHaveBeenCalledTimes(1);
    });

    it('should not fetch call types when store already has data', async () => {
      const existingCallTypes = [
        { Id: '1', Name: 'Emergency' },
        { Id: '2', Name: 'Medical' },
      ];

      // Set initial state with existing call types
      useCallsStore.setState({
        callTypes: existingCallTypes,
      });

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.fetchCallTypes();
      });

      expect(result.current.callTypes).toEqual(existingCallTypes);
      expect(mockGetCallTypes).not.toHaveBeenCalled();
    });

    it('should handle fetch call types error', async () => {
      mockGetCallTypes.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.fetchCallTypes();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch call types');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.callTypes).toEqual([]);
      });

      expect(mockGetCallTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchCallPriorities', () => {
    it('should fetch call priorities successfully', async () => {
      const mockCallPrioritiesData = [
        { Id: 1, Name: 'High' },
        { Id: 2, Name: 'Medium' },
      ];

      mockGetCallPriorities.mockResolvedValue({
        Data: mockCallPrioritiesData,
      } as any);

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.fetchCallPriorities();
      });

      await waitFor(() => {
        expect(result.current.callPriorities).toEqual(mockCallPrioritiesData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGetCallPriorities).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch call priorities error', async () => {
      mockGetCallPriorities.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.fetchCallPriorities();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch call priorities');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.callPriorities).toEqual([]);
      });

      expect(mockGetCallPriorities).toHaveBeenCalledTimes(1);
    });
  });

  describe('init', () => {
    it('should initialize all data successfully', async () => {
      const mockCallsData = [{ Id: '1', Name: 'Test Call' }];
      const mockCallPrioritiesData = [{ Id: 1, Name: 'High' }];
      const mockCallTypesData = [{ Id: '1', Name: 'Emergency' }];

      mockGetCalls.mockResolvedValue({ Data: mockCallsData } as any);
      mockGetCallPriorities.mockResolvedValue({ Data: mockCallPrioritiesData } as any);
      mockGetCallTypes.mockResolvedValue({ Data: mockCallTypesData } as any);

      const { result } = renderHook(() => useCallsStore());

      await act(async () => {
        await result.current.init();
      });

      await waitFor(() => {
        expect(result.current.calls).toEqual(mockCallsData);
        expect(result.current.callPriorities).toEqual(mockCallPrioritiesData);
        expect(result.current.callTypes).toEqual(mockCallTypesData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockGetCalls).toHaveBeenCalledTimes(1);
      expect(mockGetCallPriorities).toHaveBeenCalledTimes(1);
      expect(mockGetCallTypes).toHaveBeenCalledTimes(1);
    });
  });
});
