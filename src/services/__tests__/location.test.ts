// Mock all dependencies first
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '@/lib/logging';
import { locationService } from '../location';

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startTracking', () => {
    it('should start tracking and log the action', async () => {
      await locationService.startTracking();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Location tracking started',
      });
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking and log the action', async () => {
      await locationService.stopTracking();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Location tracking stopped',
      });
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location and log the action', async () => {
      const result = await locationService.getCurrentLocation();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Getting current location',
      });
      expect(result).toBeNull();
    });
  });

  describe('startLocationUpdates', () => {
    it('should start location updates and log the action', async () => {
      await locationService.startLocationUpdates();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Starting location updates',
      });
    });
  });
});
