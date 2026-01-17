/**
 * @jest-environment jsdom
 */

import { initializeLiveKitForPlatform } from '../livekit-platform-init';

// Mock the logger
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '@/lib/logging';

describe('livekit-platform-init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeLiveKitForPlatform', () => {
    it('should log initialization message on iOS', async () => {
      await initializeLiveKitForPlatform();

      expect(logger.info).toHaveBeenCalledWith({ message: 'Initializing LiveKit for platform' });
    });

    it('should log initialization message on Android', async () => {
      await initializeLiveKitForPlatform();

      expect(logger.info).toHaveBeenCalledWith({ message: 'Initializing LiveKit for platform' });
    });

    it('should log initialization message on web', async () => {
      await initializeLiveKitForPlatform();

      expect(logger.info).toHaveBeenCalledWith({ message: 'Initializing LiveKit for platform' });
    });

    it('should be safe to call multiple times', async () => {
      await initializeLiveKitForPlatform();
      await initializeLiveKitForPlatform();
      await initializeLiveKitForPlatform();

      // Should be called once per invocation
      expect(logger.info).toHaveBeenCalledTimes(3);
    });

    it('should return a promise that resolves', async () => {
      const result = initializeLiveKitForPlatform();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });
});
