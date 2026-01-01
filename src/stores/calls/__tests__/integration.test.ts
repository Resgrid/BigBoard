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
import { renderHook, act } from '@testing-library/react-native';

import { getCallTypes } from '@/api/calls/callTypes';
import { useCallsStore } from '../store';

// Mock the API
jest.mock('@/api/calls/callTypes');
jest.mock('@/api/calls/callPriorities');
jest.mock('@/api/calls/calls');

const mockGetCallTypes = getCallTypes as jest.MockedFunction<typeof getCallTypes>;

describe('Calls Store Integration - Call Types', () => {
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

  it('should integrate fetchCallTypes with the store correctly', async () => {
    // Mock successful API response
    const mockCallTypesResponse = {
      Data: [
        { Id: '1', Name: 'Emergency' },
        { Id: '2', Name: 'Medical' },
        { Id: '3', Name: 'Fire' },
      ],
    };

    mockGetCallTypes.mockResolvedValue(mockCallTypesResponse as any);

    const { result } = renderHook(() => useCallsStore());

    // Verify initial state
    expect(result.current.callTypes).toEqual([]);
    expect(result.current.isLoading).toBe(false);

    // Call fetchCallTypes
    await act(async () => {
      await result.current.fetchCallTypes();
    });

    // Verify the state was updated correctly
    expect(result.current.callTypes).toEqual(mockCallTypesResponse.Data);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockGetCallTypes).toHaveBeenCalledTimes(1);
  });

  it('should not fetch call types if already populated', async () => {
    // Set initial state with call types
    const existingCallTypes = [
      { Id: '1', Name: 'Emergency' },
      { Id: '2', Name: 'Medical' },
    ];

    await act(async () => {
      useCallsStore.setState({
        callTypes: existingCallTypes,
      });
    });

    const { result } = renderHook(() => useCallsStore());

    // Call fetchCallTypes
    await act(async () => {
      await result.current.fetchCallTypes();
    });

    // Verify API was not called and state remains unchanged
    expect(mockGetCallTypes).not.toHaveBeenCalled();
    expect(result.current.callTypes).toEqual(existingCallTypes);
  });

  it('should handle call types with various names and IDs', async () => {
    // Mock API response with various call types
    const mockCallTypesResponse = {
      Data: [
        { Id: 'emer_001', Name: 'Emergency Response' },
        { Id: 'med_002', Name: 'Medical Emergency' },
        { Id: 'fire_003', Name: 'Fire Department' },
        { Id: 'police_004', Name: 'Police Response' },
        { Id: 'other_005', Name: 'Other' },
      ],
    };

    mockGetCallTypes.mockResolvedValue(mockCallTypesResponse as any);

    const { result } = renderHook(() => useCallsStore());

    await act(async () => {
      await result.current.fetchCallTypes();
    });

    // Verify all call types are stored correctly
    expect(result.current.callTypes).toHaveLength(5);
    expect(result.current.callTypes).toEqual(mockCallTypesResponse.Data);

    // Verify specific call types
    const emergencyType = result.current.callTypes.find((t) => t.Id === 'emer_001');
    expect(emergencyType).toBeDefined();
    expect(emergencyType?.Name).toBe('Emergency Response');

    const otherType = result.current.callTypes.find((t) => t.Id === 'other_005');
    expect(otherType).toBeDefined();
    expect(otherType?.Name).toBe('Other');
  });

  it('should maintain call types state across multiple hook renders', async () => {
    const mockCallTypesResponse = {
      Data: [
        { Id: '1', Name: 'Emergency' },
        { Id: '2', Name: 'Medical' },
      ],
    };

    mockGetCallTypes.mockResolvedValue(mockCallTypesResponse as any);

    // First render
    const { result: result1 } = renderHook(() => useCallsStore());

    await act(async () => {
      await result1.current.fetchCallTypes();
    });

    // Second render (simulating component re-render)
    const { result: result2 } = renderHook(() => useCallsStore());

    // Verify state is consistent across renders
    expect(result1.current.callTypes).toEqual(result2.current.callTypes);
    expect(result2.current.callTypes).toEqual(mockCallTypesResponse.Data);
  });
});
