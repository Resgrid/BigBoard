/**
 * GPS Integration Tests for Status Bottom Sheet
 * Tests GPS coordinate handling in status submissions
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

jest.mock('@/services/offline-event-manager.service', () => ({
  offlineEventManager: {
    queueUnitStatusEvent: jest.fn(),
  },
}));

const mockUseLocationStore = useLocationStore as jest.MockedFunction<any>;
const mockUseCoreStore = require('@/stores/app/core-store').useCoreStore as jest.MockedFunction<any>;
const mockSaveUnitStatus = require('@/api/units/unitStatuses').saveUnitStatus as jest.MockedFunction<any>;
const mockOfflineEventManager = require('@/services/offline-event-manager.service').offlineEventManager;

describe('Status GPS Integration', () => {
  let mockLocationStore: any;
  let mockCoreStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocationStore = {
      latitude: null,
      longitude: null,
      heading: null,
      accuracy: null,
      speed: null,
      altitude: null,
      timestamp: null,
    };

    mockCoreStore = {
      activeUnit: { UnitId: 'unit1' },
      setActiveUnitWithFetch: jest.fn(),
    };

    mockUseLocationStore.mockImplementation(() => {
      console.log('useLocationStore called, returning:', mockLocationStore);
      return mockLocationStore;
    });
    // Also mock getState method
    (mockUseLocationStore as any).getState = jest.fn().mockReturnValue(mockLocationStore);

    mockUseCoreStore.mockReturnValue(mockCoreStore);
    mockUseCoreStore.mockReturnValue(mockCoreStore);
    // Also mock getState for the status store logic
    (mockUseCoreStore as any).getState = jest.fn().mockReturnValue(mockCoreStore);
  });

  describe('GPS Coordinate Integration', () => {
    it('should include GPS coordinates and metadata in payload during successful submission', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up location data
      mockLocationStore.latitude = 40.7128;
      mockLocationStore.longitude = -74.0060;
      mockLocationStore.accuracy = 10;
      mockLocationStore.altitude = 50;
      mockLocationStore.speed = 0;
      mockLocationStore.heading = 180;

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';
      input.Note = 'GPS enabled status';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Id: 'unit1',
          Type: '1',
          Note: 'GPS enabled status',
          Latitude: '40.7128',
          Longitude: '-74.006',
          Accuracy: '10',
          Altitude: '50',
          AltitudeAccuracy: '',
          Speed: '0',
          Heading: '180',
        })
      );
    });

    it('should not include GPS coordinates when location data is not available', async () => {
      const { result } = renderHook(() => useStatusesStore());

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';
      input.Note = 'No GPS status';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Id: 'unit1',
          Type: '1',
          Note: 'No GPS status',
          Latitude: '',
          Longitude: '',
          Accuracy: '',
          Altitude: '',
          Speed: '',
          Heading: '',
        })
      );
    });

    it('should handle partial GPS data (only lat/lon available)', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up minimal location data
      mockLocationStore.latitude = 40.7128;
      mockLocationStore.longitude = -74.0060;
      // Other fields remain null

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Latitude: '40.7128',
          Longitude: '-74.006',
          Accuracy: '',
          Altitude: '',
          Speed: '',
          Heading: '',
        })
      );
    });

    it('should handle high precision GPS coordinates', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up high precision location data
      mockLocationStore.latitude = 40.712821;
      mockLocationStore.longitude = -74.006015;
      mockLocationStore.accuracy = 3;
      mockLocationStore.altitude = 10.5;
      mockLocationStore.speed = 5.2;
      mockLocationStore.heading = 245.8;

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Latitude: '40.712821',
          Longitude: '-74.006015',
          Accuracy: '3',
          Altitude: '10.5',
          Speed: '5.2',
          Heading: '245.8',
        })
      );
    });

    it('should handle edge case GPS values (zeros and negatives)', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up edge case location data
      mockLocationStore.latitude = 0;
      mockLocationStore.longitude = 0;
      mockLocationStore.accuracy = 0;
      mockLocationStore.altitude = -50; // Below sea level
      mockLocationStore.speed = 0;
      mockLocationStore.heading = 0;

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Latitude: '0',
          Longitude: '0',
          Accuracy: '0',
          Altitude: '-50',
          Speed: '0',
          Heading: '0',
        })
      );
    });

    it('should prioritize input GPS coordinates over location store when both exist', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up location store data
      mockLocationStore.latitude = 40.7128;
      mockLocationStore.longitude = -74.0060;
      mockLocationStore.accuracy = 10;

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';
      // Pre-populate input with different GPS coordinates
      input.Latitude = '41.8781';
      input.Longitude = '-87.6298';
      input.Accuracy = '5';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      // Should use the input coordinates, not location store
      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Latitude: '41.8781',
          Longitude: '-87.6298',
          Accuracy: '5',
        })
      );
    });

    it('should handle null/undefined GPS values gracefully', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Set up mixed null/undefined location data
      mockLocationStore.latitude = 40.7128;
      mockLocationStore.longitude = -74.0060;
      mockLocationStore.accuracy = null;
      mockLocationStore.altitude = undefined;
      mockLocationStore.speed = null;
      mockLocationStore.heading = undefined;

      mockSaveUnitStatus.mockResolvedValue({});

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '1';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockSaveUnitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          Latitude: '40.7128',
          Longitude: '-74.006',
          Accuracy: '',
          Altitude: '',
          Speed: '',
          Heading: '',
        })
      );
    });
  });

  describe('Offline GPS Integration', () => {
    it('should queue GPS data with partial location information', async () => {
      const { result } = renderHook(() => useStatusesStore());

      // Only latitude and longitude available
      mockLocationStore.latitude = 35.6762;
      mockLocationStore.longitude = 139.6503;

      mockSaveUnitStatus.mockRejectedValue(new Error('Network error'));

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '4';
      input.Note = 'Partial GPS';

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockOfflineEventManager.queueUnitStatusEvent).toHaveBeenCalledWith(
        'unit1',
        '4',
        'Partial GPS',
        '',
        [],
        {
          latitude: '35.6762',
          longitude: '139.6503',
          accuracy: '',
          altitude: '',
          altitudeAccuracy: '',
          speed: '',
          heading: '',
        }
      );
    });

    it('should handle GPS data with roles and complex status data', async () => {
      const { result } = renderHook(() => useStatusesStore());

      mockLocationStore.latitude = 51.5074;
      mockLocationStore.longitude = -0.1278;
      mockLocationStore.accuracy = 8;
      mockLocationStore.speed = 30;

      mockSaveUnitStatus.mockRejectedValue(new Error('Network error'));

      const input = new SaveUnitStatusInput();
      input.Id = 'unit1';
      input.Type = '5';
      input.Note = 'Complex status with GPS';
      input.RespondingTo = 'call123';
      input.Roles = [
        {
          Id: '1',
          EventId: '',
          UserId: 'user1',
          RoleId: 'role1',
          Name: 'Driver',
        },
      ];

      await act(async () => {
        await result.current.saveUnitStatus(input);
      });

      expect(mockOfflineEventManager.queueUnitStatusEvent).toHaveBeenCalledWith(
        'unit1',
        '5',
        'Complex status with GPS',
        'call123',
        expect.arrayContaining([
          expect.objectContaining({
            RoleId: 'role1',
            UserId: 'user1',
          }),
        ]),
        {
          latitude: '51.5074',
          longitude: '-0.1278',
          accuracy: '8',
          altitude: '',
          altitudeAccuracy: '',
          speed: '30',
          heading: '',
        }
      );
    });
  });
});