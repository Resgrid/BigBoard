/**
 * GPS Coordinate Duplication Fix Validation Tests
 * Tests to ensure the coordinate duplication issue is fixed
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

jest.mock('@/stores/app/location-store', () => ({
  useLocationStore: jest.fn(),
}));

// Get the mocked functions
const { saveUnitStatus: mockSaveUnitStatus } = jest.requireMock('@/api/units/unitStatuses');
const mockUseLocationStore = useLocationStore as jest.MockedFunction<any>;
const mockUseCoreStore = jest.requireMock('@/stores/app/core-store').useCoreStore;

describe('GPS Coordinate Duplication Fix', () => {
  let mockLocationStore: any;
  let mockCoreStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock location store
    mockLocationStore = {
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      speed: null,
      heading: null,
      timestamp: null,
    };

    mockUseLocationStore.mockImplementation(() => mockLocationStore);
    (mockUseLocationStore as any).getState = jest.fn().mockReturnValue(mockLocationStore);

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

  it('should not duplicate coordinates when input already has coordinates', async () => {
    const { result } = renderHook(() => useStatusesStore());

    // Set up location store with coordinates
    mockLocationStore.latitude = 40.7128;
    mockLocationStore.longitude = -74.0060;
    mockLocationStore.accuracy = 10;

    mockSaveUnitStatus.mockResolvedValue({});

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    // Pre-populate with existing coordinates
    input.Latitude = '41.8781';
    input.Longitude = '-87.6298';
    input.Accuracy = '5';

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    // Should use input coordinates, not location store coordinates
    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '41.8781',
        Longitude: '-87.6298',
        Accuracy: '5',
      })
    );
  });

  it('should populate coordinates only when both latitude and longitude are missing', async () => {
    const { result } = renderHook(() => useStatusesStore());

    // Set up location store with coordinates
    mockLocationStore.latitude = 40.7128;
    mockLocationStore.longitude = -74.0060;
    mockLocationStore.accuracy = 10;

    mockSaveUnitStatus.mockResolvedValue({});

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    // Only set latitude, leave longitude empty
    input.Latitude = '41.8781';
    input.Longitude = '';

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    // Should keep existing latitude and not populate from location store
    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '41.8781',
        Longitude: '',
      })
    );
  });

  it('should include AltitudeAccuracy field in coordinate population', async () => {
    const { result } = renderHook(() => useStatusesStore());

    // Set up location store with coordinates
    mockLocationStore.latitude = 40.7128;
    mockLocationStore.longitude = -74.0060;
    mockLocationStore.accuracy = 10;
    mockLocationStore.altitude = 50;
    mockLocationStore.speed = 5;
    mockLocationStore.heading = 180;

    mockSaveUnitStatus.mockResolvedValue({});

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';
    // Leave coordinates empty to trigger population

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '40.7128',
        Longitude: '-74.006',
        Accuracy: '10',
        Altitude: '50',
        AltitudeAccuracy: '', // Should be empty string since location store doesn't provide it
        Speed: '5',
        Heading: '180',
      })
    );
  });

  it('should populate empty strings for all GPS fields when no location data available', async () => {
    const { result } = renderHook(() => useStatusesStore());

    // Location store has no coordinates
    mockLocationStore.latitude = null;
    mockLocationStore.longitude = null;

    mockSaveUnitStatus.mockResolvedValue({});

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';

    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        Latitude: '',
        Longitude: '',
        Accuracy: '',
        Altitude: '',
        AltitudeAccuracy: '',
        Speed: '',
        Heading: '',
      })
    );
  });

  it('should handle setActiveUnitWithFetch returning undefined without error', async () => {
    const { result } = renderHook(() => useStatusesStore());

    // Mock setActiveUnitWithFetch to return undefined (simulating the bug)
    mockCoreStore.setActiveUnitWithFetch = jest.fn().mockReturnValue(undefined);

    mockSaveUnitStatus.mockResolvedValue({});

    const input = new SaveUnitStatusInput();
    input.Id = 'unit1';
    input.Type = '1';

    // This should not throw an error
    await act(async () => {
      await result.current.saveUnitStatus(input);
    });

    expect(mockSaveUnitStatus).toHaveBeenCalled();
  });
});