/**
 * Location Update Validation Tests
 * Ensures that GPS coordinate duplication fix does not interfere with location updates
 */

import { act, renderHook } from '@testing-library/react-native';

import { SaveUnitStatusInput } from '@/models/v4/unitStatus/saveUnitStatusInput';
import { useLocationStore } from '@/stores/app/location-store';
import { useStatusesStore } from '@/stores/status/store';

// Mock the dependencies
jest.mock('@/api/units/unitStatuses', () => ({
  saveUnitStatus: jest.fn(),
}));

jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: jest.fn(),
}));

// Get the mocked functions
const { saveUnitStatus: mockSaveUnitStatus } = jest.requireMock('@/api/units/unitStatuses');
const mockUseCoreStore = jest.requireMock('@/stores/app/core-store').useCoreStore;

describe('Location Update Validation', () => {
  let mockCoreStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock core store
    mockCoreStore = {
      activeUnit: {
        UnitId: 'unit-test',
      },
      setActiveUnitWithFetch: jest.fn().mockResolvedValue({}),
    };

    mockUseCoreStore.mockReturnValue(mockCoreStore);
    (mockUseCoreStore as any).getState = jest.fn().mockReturnValue(mockCoreStore);
  });

  it('should allow location store to be updated with new coordinates', () => {
    const { result } = renderHook(() => useLocationStore());

    // Initially no location
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();

    // Simulate location service updating the store with new coordinates
    const newLocation1 = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 50,
        speed: 5,
        heading: 180,
        altitudeAccuracy: 2,
      },
      timestamp: 1640995200000,
    };

    act(() => {
      result.current.setLocation(newLocation1);
    });

    // Location should be updated
    expect(result.current.latitude).toBe(40.7128);
    expect(result.current.longitude).toBe(-74.0060);
    expect(result.current.accuracy).toBe(10);
    expect(result.current.altitude).toBe(50);
    expect(result.current.speed).toBe(5);
    expect(result.current.heading).toBe(180);

    // Simulate another location update (movement)
    const newLocation2 = {
      coords: {
        latitude: 41.8781,
        longitude: -87.6298,
        accuracy: 8,
        altitude: 60,
        speed: 15,
        heading: 90,
        altitudeAccuracy: 3,
      },
      timestamp: 1640995260000, // 1 minute later
    };

    act(() => {
      result.current.setLocation(newLocation2);
    });

    // Location should be updated again
    expect(result.current.latitude).toBe(41.8781);
    expect(result.current.longitude).toBe(-87.6298);
    expect(result.current.accuracy).toBe(8);
    expect(result.current.altitude).toBe(60);
    expect(result.current.speed).toBe(15);
    expect(result.current.heading).toBe(90);
    expect(result.current.timestamp).toBe(1640995260000);
  });

  it('should read updated location data when saving status without pre-populated coordinates', async () => {
    const { result: locationResult } = renderHook(() => useLocationStore());
    const { result: statusResult } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockResolvedValue({});

    // Set initial location
    const initialLocation = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 50,
        speed: 5,
        heading: 180,
        altitudeAccuracy: 2,
      },
      timestamp: 1640995200000,
    };

    act(() => {
      locationResult.current.setLocation(initialLocation);
    });

    // Save status without coordinates - should use location store
    const input1 = new SaveUnitStatusInput();
    input1.Id = 'unit1';
    input1.Type = '1';

    await act(async () => {
      await statusResult.current.saveUnitStatus(input1);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '40.7128',
        Longitude: '-74.006',
        Accuracy: '10',
        Altitude: '50',
        Speed: '5',
        Heading: '180',
      })
    );

    // Now update location (simulating user movement)
    const updatedLocation = {
      coords: {
        latitude: 41.8781,
        longitude: -87.6298,
        accuracy: 8,
        altitude: 60,
        speed: 15,
        heading: 90,
        altitudeAccuracy: 3,
      },
      timestamp: 1640995260000,
    };

    act(() => {
      locationResult.current.setLocation(updatedLocation);
    });

    // Save another status - should use the NEW location data
    const input2 = new SaveUnitStatusInput();
    input2.Id = 'unit1';
    input2.Type = '2';

    await act(async () => {
      await statusResult.current.saveUnitStatus(input2);
    });

    expect(mockSaveUnitStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        Latitude: '41.8781',
        Longitude: '-87.6298',
        Accuracy: '8',
        Altitude: '60',
        Speed: '15',
        Heading: '90',
      })
    );
  });

  it('should continue to respect pre-populated coordinates even after location updates', async () => {
    const { result: locationResult } = renderHook(() => useLocationStore());
    const { result: statusResult } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockResolvedValue({});

    // Set location store data
    const locationData = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 50,
        speed: 5,
        heading: 180,
        altitudeAccuracy: 2,
      },
      timestamp: 1640995200000,
    };

    act(() => {
      locationResult.current.setLocation(locationData);
    });

    // Save status WITH pre-populated coordinates
    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    input.Latitude = '35.6762'; // Different from location store
    input.Longitude = '139.6503'; // Different from location store
    input.Accuracy = '5';

    await act(async () => {
      await statusResult.current.saveUnitStatus(input);
    });

    // Should use the pre-populated coordinates, not location store
    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '35.6762',
        Longitude: '139.6503',
        Accuracy: '5',
      })
    );
  });

  it('should demonstrate the fix prevents coordinate duplication but allows location updates', async () => {
    const { result: locationResult } = renderHook(() => useLocationStore());
    const { result: statusResult } = renderHook(() => useStatusesStore());

    mockSaveUnitStatus.mockResolvedValue({});

    // Set location store data
    const locationData = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 50,
        speed: 5,
        heading: 180,
        altitudeAccuracy: 2,
      },
      timestamp: 1640995200000,
    };

    act(() => {
      locationResult.current.setLocation(locationData);
    });

    // Test case that would have caused duplication before the fix:
    // Input has latitude but missing longitude
    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    input.Latitude = '35.6762'; // Has latitude
    input.Longitude = ''; // Missing longitude

    await act(async () => {
      await statusResult.current.saveUnitStatus(input);
    });

    // With our fix: Should NOT populate from location store
    // because only one coordinate is missing (old behavior would have caused duplication)
    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '35.6762', // Keeps original
        Longitude: '', // Stays empty
      })
    );

    // But location updates should still work fine
    const newLocationData = {
      coords: {
        latitude: 41.8781,
        longitude: -87.6298,
        accuracy: 8,
        altitude: 60,
        speed: 15,
        heading: 90,
        altitudeAccuracy: 3,
      },
      timestamp: 1640995260000,
    };

    act(() => {
      locationResult.current.setLocation(newLocationData);
    });

    // Verify location was updated
    expect(locationResult.current.latitude).toBe(41.8781);
    expect(locationResult.current.longitude).toBe(-87.6298);
  });
});