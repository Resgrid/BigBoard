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

// Mock CallKeep service
jest.mock('../callkeep.service.ios', () => ({
  callKeepService: {
    setup: jest.fn(),
    cleanup: jest.fn(),
  },
}));

import { Platform } from 'react-native';

import { logger } from '../../lib/logging';
import { appInitializationService } from '../app-initialization.service';
import { callKeepService } from '../callkeep.service.ios';

const mockLogger = logger as jest.Mocked<typeof logger>;
const mockCallKeepService = callKeepService as jest.Mocked<typeof callKeepService>;

describe('AppInitializationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service for each test
    appInitializationService.reset();
    mockCallKeepService.setup.mockResolvedValue(undefined);
    mockCallKeepService.cleanup.mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should initialize successfully on iOS', async () => {
      (Platform as any).OS = 'ios';

      await appInitializationService.initialize();

      expect(mockCallKeepService.setup).toHaveBeenCalledWith({
        appName: 'Resgrid Unit',
        maximumCallGroups: 1,
        maximumCallsPerCallGroup: 1,
        includesCallsInRecents: false,
        supportsVideo: false,
      });

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

      expect(mockCallKeepService.setup).not.toHaveBeenCalled();
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
      expect(mockCallKeepService.setup).toHaveBeenCalledTimes(1);

      // Second call
      await appInitializationService.initialize();
      expect(mockCallKeepService.setup).toHaveBeenCalledTimes(1); // Should not be called again

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

      // CallKeep setup should only be called once
      expect(mockCallKeepService.setup).toHaveBeenCalledTimes(1);
      expect(appInitializationService.isAppInitialized()).toBe(true);
    });

    it('should handle CallKeep setup errors gracefully', async () => {
      (Platform as any).OS = 'ios';
      const error = new Error('CallKeep setup failed');
      mockCallKeepService.setup.mockRejectedValue(error);

      // Should not throw error - CallKeep failure shouldn't prevent app startup
      await appInitializationService.initialize();

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to initialize CallKeep',
        context: { error },
      });

      // App should still be considered initialized
      expect(appInitializationService.isAppInitialized()).toBe(true);
    });

    it('should allow retry after failed initialization', async () => {
      (Platform as any).OS = 'ios';
      const error = new Error('Initialization failed');

      // Mock a failure in the internal initialization process
      const originalSetup = mockCallKeepService.setup;
      mockCallKeepService.setup.mockRejectedValueOnce(error);

      // First attempt should complete (CallKeep errors are not thrown)
      await appInitializationService.initialize();
      expect(appInitializationService.isAppInitialized()).toBe(true);

      // Reset and try again
      appInitializationService.reset();
      mockCallKeepService.setup.mockImplementation(originalSetup);

      await appInitializationService.initialize();
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

      expect(mockCallKeepService.cleanup).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'App initialization service cleaned up',
      });
      expect(appInitializationService.isAppInitialized()).toBe(false);
    });

    it('should handle cleanup errors gracefully', async () => {
      (Platform as any).OS = 'ios';
      const error = new Error('Cleanup failed');
      mockCallKeepService.cleanup.mockRejectedValue(error);

      // Initialize first
      await appInitializationService.initialize();

      // Cleanup should not throw
      await appInitializationService.cleanup();

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Error during app initialization service cleanup',
        context: { error },
      });
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
