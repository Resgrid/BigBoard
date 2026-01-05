import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock logger
jest.mock('../../lib/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocks
import { CallKeepService, callKeepService } from '../callkeep.service.ios';
import { logger } from '../../lib/logging';

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('CallKeepService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset the singleton instance for each test
    (CallKeepService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CallKeepService.getInstance();
      const instance2 = CallKeepService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should export singleton instance', () => {
      expect(callKeepService).toBeInstanceOf(CallKeepService);
    });
  });

  describe('Setup', () => {
    it('should log when setup is called', async () => {
      const service = CallKeepService.getInstance();
      await service.setup();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'CallKeep service setup (iOS)',
      });
    });
  });

  describe('Display Incoming Call', () => {
    it('should log when displaying incoming call', async () => {
      const service = CallKeepService.getInstance();
      await service.displayIncomingCall('call-123', 'John Doe');

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Displaying incoming call',
        context: { callId: 'call-123', handle: 'John Doe' },
      });
    });
  });

  describe('End Call', () => {
    it('should log when ending call', async () => {
      const service = CallKeepService.getInstance();
      await service.endCall('call-123');

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Ending call',
        context: { callId: 'call-123' },
      });
    });
  });

  describe('Cleanup', () => {
    it('should log when cleaning up', async () => {
      const service = CallKeepService.getInstance();
      await service.cleanup();

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Cleaning up CallKeep service',
      });
    });
  });
});
