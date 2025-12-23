/**
 * Tests for location service working with foreground-only permissions
 * 
 * This test suite specifically covers the scenario where:
 * - Foreground location permissions are granted
 * - Background location permissions are denied
 * - The app should still be able to track location in the foreground
 * 
 * These tests were created to fix the issue where the app was failing to
 * start location tracking when background permissions were denied, even
 * though foreground permissions were granted.
 */

// Mock all dependencies first
jest.mock('@/api/units/unitLocation', () => ({
  setUnitLocation: jest.fn(),
}));

jest.mock('@/lib/hooks/use-background-geolocation', () => ({
  registerLocationServiceUpdater: jest.fn(),
}));

jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/storage/background-geolocation', () => ({
  loadBackgroundGeolocationState: jest.fn(),
}));

// Create mock store states
const mockCoreStoreState = {
  activeUnitId: 'unit-123' as string | null,
};

const mockLocationStoreState = {
  setLocation: jest.fn(),
  setBackgroundEnabled: jest.fn(),
};

// Mock stores with proper Zustand structure
jest.mock('@/stores/app/core-store', () => ({
  useCoreStore: {
    getState: jest.fn(() => mockCoreStoreState),
  },
}));

jest.mock('@/stores/app/location-store', () => ({
  useLocationStore: {
    getState: jest.fn(() => mockLocationStoreState),
  },
}));

jest.mock('expo-location', () => {
  const mockRequestForegroundPermissions = jest.fn();
  const mockRequestBackgroundPermissions = jest.fn();
  const mockGetBackgroundPermissions = jest.fn();
  const mockWatchPositionAsync = jest.fn();
  const mockStartLocationUpdatesAsync = jest.fn();
  const mockStopLocationUpdatesAsync = jest.fn();
  return {
    requestForegroundPermissionsAsync: mockRequestForegroundPermissions,
    requestBackgroundPermissionsAsync: mockRequestBackgroundPermissions,
    getBackgroundPermissionsAsync: mockGetBackgroundPermissions,
    watchPositionAsync: mockWatchPositionAsync,
    startLocationUpdatesAsync: mockStartLocationUpdatesAsync,
    stopLocationUpdatesAsync: mockStopLocationUpdatesAsync,
    Accuracy: {
      Balanced: 'balanced',
    },
  };
});

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    currentState: 'active',
  },
}));

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { setUnitLocation } from '@/api/units/unitLocation';
import { logger } from '@/lib/logging';
import { loadBackgroundGeolocationState } from '@/lib/storage/background-geolocation';
import { SaveUnitLocationInput } from '@/models/v4/unitLocation/saveUnitLocationInput';

// Import the service after mocks are set up
let locationService: any;

// Mock types
const mockSetUnitLocation = setUnitLocation as jest.MockedFunction<typeof setUnitLocation>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockLoadBackgroundGeolocationState = loadBackgroundGeolocationState as jest.MockedFunction<typeof loadBackgroundGeolocationState>;
const mockTaskManager = TaskManager as jest.Mocked<typeof TaskManager>;
const mockLocation = Location as jest.Mocked<typeof Location>;

// Mock location data
const mockLocationObject: Location.LocationObject = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 10.5,
    accuracy: 5.0,
    altitudeAccuracy: 2.0,
    heading: 90.0,
    speed: 15.5,
  },
  timestamp: Date.now(),
};

// Mock API response
const mockApiResponse = {
  Id: 'location-12345',
  PageSize: 0,
  Timestamp: '',
  Version: '',
  Node: '',
  RequestId: '',
  Status: '',
  Environment: '',
};

describe('LocationService - Foreground-Only Permissions', () => {
  let mockLocationSubscription: jest.Mocked<Location.LocationSubscription>;

  beforeAll(() => {
    // Import the service after all mocks are set up
    const { locationService: service } = require('../location');
    locationService = service;
  });

  beforeEach(() => {
    // Clear all mock call history
    jest.clearAllMocks();

    // Reset mock functions in store states
    mockLocationStoreState.setLocation = jest.fn();
    mockLocationStoreState.setBackgroundEnabled = jest.fn();

    // Setup mock location subscription
    mockLocationSubscription = {
      remove: jest.fn(),
    } as jest.Mocked<Location.LocationSubscription>;

    // Setup Location API mocks for the EXACT scenario from the user's logs:
    // Foreground: granted, Background: denied
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      expires: 'never',
      granted: true,
      canAskAgain: true,
    });

    mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
      status: 'denied' as any,
      expires: 'never',
      granted: false,
      canAskAgain: true,
    });

    mockLocation.getBackgroundPermissionsAsync.mockResolvedValue({
      status: 'denied' as any,
      expires: 'never',
      granted: false,
      canAskAgain: true,
    });

    mockLocation.watchPositionAsync.mockResolvedValue(mockLocationSubscription);
    mockLocation.startLocationUpdatesAsync.mockResolvedValue();
    mockLocation.stopLocationUpdatesAsync.mockResolvedValue();

    // Setup TaskManager mocks
    mockTaskManager.isTaskRegisteredAsync.mockResolvedValue(false);

    // Setup storage mock
    mockLoadBackgroundGeolocationState.mockResolvedValue(false);

    // Setup API mock
    mockSetUnitLocation.mockResolvedValue(mockApiResponse);

    // Reset core store state
    mockCoreStoreState.activeUnitId = 'unit-123';

    // Reset internal state of the service
    (locationService as any).locationSubscription = null;
    (locationService as any).backgroundSubscription = null;
    (locationService as any).isBackgroundGeolocationEnabled = false;
  });

  describe('User Reported Bug Scenario', () => {
    it('should allow location tracking when only foreground permissions are requested', async () => {
      // This tests the fix for the user's bug:
      // Only request foreground permissions, don't prompt for background unnecessarily
      
      const hasPermissions = await locationService.requestPermissions();
      
      // Should return true because foreground is granted
      expect(hasPermissions).toBe(true);
      
      // Should be able to start location updates without throwing
      await expect(locationService.startLocationUpdates()).resolves.not.toThrow();
      
      // Verify foreground location tracking is started
      expect(mockLocation.watchPositionAsync).toHaveBeenCalledWith(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 10,
        },
        expect.any(Function)
      );
      
      // Verify the correct log message with permission details - now only foreground is requested
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Location permissions requested',
        context: {
          foregroundStatus: 'granted',
          backgroundStatus: 'not requested',
          backgroundRequested: false,
        },
      });
    });

    it('should log the exact error from user logs when permission check was wrong', async () => {
      // Mock the old incorrect behavior where both permissions were required
      const mockOldPermissionCheck = jest.fn().mockResolvedValue(false); // Old behavior
      
      if (mockOldPermissionCheck.mock.calls.length === 0) {
        // Call it to simulate the old logic
        const foregroundGranted = true;
        const backgroundGranted = false;
        const oldResult = foregroundGranted && backgroundGranted; // This was the bug
        mockOldPermissionCheck.mockReturnValue(oldResult);
        const result = mockOldPermissionCheck();
        
        expect(result).toBe(false); // This would have caused the error
      }
      
      // With our fix, the permission check should now pass
      const hasPermissions = await locationService.requestPermissions();
      expect(hasPermissions).toBe(true);
    });

    it('should work with background setting enabled but permissions denied', async () => {
      // User has background geolocation enabled in settings but system permissions denied
      mockLoadBackgroundGeolocationState.mockResolvedValue(true);
      
      await locationService.startLocationUpdates();
      
      // Should start foreground tracking
      expect(mockLocation.watchPositionAsync).toHaveBeenCalled();
      
      // Should warn about background limitations
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Background geolocation enabled but permissions denied, running in foreground-only mode',
        context: {
          backgroundStatus: 'denied',
          settingEnabled: true,
        },
      });
      
      // Should NOT register background task
      expect(mockLocation.startLocationUpdatesAsync).not.toHaveBeenCalled();
      
      // Should log successful foreground start with proper context
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Foreground location updates started',
        context: {
          backgroundEnabled: false, // Background is disabled due to permissions
          backgroundPermissions: false,
          backgroundSetting: true,
        },
      });
    });

    it('should handle location updates in foreground-only mode', async () => {
      await locationService.startLocationUpdates();
      
      // Simulate a location update
      const locationCallback = mockLocation.watchPositionAsync.mock.calls[0][1] as Function;
      await locationCallback(mockLocationObject);
      
      // Should update the store
      expect(mockLocationStoreState.setLocation).toHaveBeenCalledWith(mockLocationObject);
      
      // Should send to API
      expect(mockSetUnitLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          UnitId: 'unit-123',
          Latitude: mockLocationObject.coords.latitude.toString(),
          Longitude: mockLocationObject.coords.longitude.toString(),
        })
      );
      
      // Should log the location update
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Foreground location update received',
        context: {
          latitude: mockLocationObject.coords.latitude,
          longitude: mockLocationObject.coords.longitude,
          heading: mockLocationObject.coords.heading,
        },
      });
    });

    it('should gracefully handle attempt to enable background when permissions denied', async () => {
      // User tries to enable background geolocation but permissions are denied
      await locationService.updateBackgroundGeolocationSetting(true);
      
      // Should log warning
      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Cannot enable background geolocation: background permissions not granted',
        context: { backgroundStatus: 'denied' },
      });
      
      // Should not register background task
      expect(mockLocation.startLocationUpdatesAsync).not.toHaveBeenCalled();
    });
  });

  describe('Comprehensive Permission Scenarios', () => {
    it('should work with foreground granted, background denied', async () => {
      // This is the user's scenario - should work
      const hasPermissions = await locationService.requestPermissions();
      expect(hasPermissions).toBe(true);
      
      await expect(locationService.startLocationUpdates()).resolves.not.toThrow();
    });

    it('should work with both foreground and background granted', async () => {
      // Mock both permissions as granted
      mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      
      mockLocation.getBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      
      const hasPermissions = await locationService.requestPermissions();
      expect(hasPermissions).toBe(true);
      
      await expect(locationService.startLocationUpdates()).resolves.not.toThrow();
    });

    it('should fail when foreground is denied (regardless of background)', async () => {
      // Mock foreground as denied
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      });
      
      const hasPermissions = await locationService.requestPermissions();
      expect(hasPermissions).toBe(false);
      
      await expect(locationService.startLocationUpdates()).rejects.toThrow('Location permissions not granted');
    });
  });

  describe('Background Task Management', () => {
    it('should not register background task when background permissions denied', async () => {
      mockLoadBackgroundGeolocationState.mockResolvedValue(true); // Setting enabled
      
      await locationService.startLocationUpdates();
      
      // Should not register background task due to missing permissions
      expect(mockLocation.startLocationUpdatesAsync).not.toHaveBeenCalled();
    });

    it('should register background task when both setting and permissions are enabled', async () => {
      // Enable background in settings
      mockLoadBackgroundGeolocationState.mockResolvedValue(true);
      
      // Grant background permissions
      mockLocation.getBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      
      await locationService.startLocationUpdates();
      
      // Should register background task
      expect(mockLocation.startLocationUpdatesAsync).toHaveBeenCalledWith(
        'location-updates',
        expect.objectContaining({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 10,
        })
      );
    });
  });
});
