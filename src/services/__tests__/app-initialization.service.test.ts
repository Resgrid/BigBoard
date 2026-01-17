// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock logger
jest.mock('../../lib/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { Platform } from 'react-native';

import { logger } from '../../lib/logging';
import { appInitializationService } from '../app-initialization.service';

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AppInitializationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service for each test
    appInitializationService.reset();
  });

  describe('Initialization', () => {
    it('should initialize successfully on iOS', async () => {
      (Platform as any).OS = 'ios';

      await appInitializationService.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Starting app initialization',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'CallKeep initialized successfully',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'App initialization completed successfully',
      });

      expect(appInitializationService.isAppInitialized()).toBe(true);
    });

    it('should skip CallKeep initialization on Android', async () => {
      (Platform as any).OS = 'android';

      await appInitializationService.initialize();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'CallKeep initialization skipped - not iOS platform',
        context: { platform: 'android' },
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'App initialization completed successfully',
      });

      expect(appInitializationService.isAppInitialized()).toBe(true);
    });

    it('should be idempotent - calling initialize multiple times should not re-initialize', async () => {
      (Platform as any).OS = 'ios';

      // First call
      await appInitializationService.initialize();

      // Second call
      await appInitializationService.initialize();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'App initialization already completed, skipping',
      });
    });

    it('should handle concurrent initialization calls', async () => {
      (Platform as any).OS = 'ios';

      // Start multiple initialization calls concurrently
      const promises = [
        appInitializationService.initialize(),
        appInitializationService.initialize(),
        appInitializationService.initialize(),
      ];

      await Promise.all(promises);

      // Should be initialized after all calls complete
      expect(appInitializationService.isAppInitialized()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      (Platform as any).OS = 'ios';

      // Initialize first
      await appInitializationService.initialize();
      expect(appInitializationService.isAppInitialized()).toBe(true);

      // Cleanup
      await appInitializationService.cleanup();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'App initialization service cleaned up',
      });
      expect(appInitializationService.isAppInitialized()).toBe(false);
    });
  });

  describe('Reset functionality', () => {
    it('should reset initialization state', async () => {
      (Platform as any).OS = 'ios';

      // Initialize
      await appInitializationService.initialize();
      expect(appInitializationService.isAppInitialized()).toBe(true);

      // Reset
      appInitializationService.reset();
      expect(appInitializationService.isAppInitialized()).toBe(false);

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'App initialization service reset',
      });

      // Should be able to initialize again
      await appInitializationService.initialize();
      expect(appInitializationService.isAppInitialized()).toBe(true);
    });
  });

  describe('Singleton behavior', () => {
    it('should return the same instance', () => {
      const instance1 = require('../app-initialization.service').appInitializationService;
      const instance2 = require('../app-initialization.service').appInitializationService;

      expect(instance1).toBe(instance2);
    });
  });
});
