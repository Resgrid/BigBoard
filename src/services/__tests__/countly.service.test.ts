import { logger } from '../../lib/logging';
import { countlyService } from '../analytics.service';

jest.mock('@/lib/countly', () => ({
  __esModule: true,
  default: {
    events: {
      recordEvent: jest.fn(),
    },
  },
}));

jest.mock('../../lib/logging', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('CountlyService', () => {
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should provide countlyService instance', () => {
      expect(countlyService).toBeDefined();
    });

    it('should track events', () => {
      const Countly = require('@/lib/countly').default;
      
      countlyService.trackEvent('test_event', { prop1: 'value1' });
      
      expect(Countly.events.recordEvent).toHaveBeenCalledWith('test_event', { prop1: 'value1' }, 1);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tracking Countly event',
        context: { eventName: 'test_event', segmentation: { prop1: 'value1' } },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Analytics event tracked successfully',
        context: { eventName: 'test_event', properties: { prop1: 'value1' } },
      });
    });

    it('should not track events when disabled', () => {
      const Countly = require('@/lib/countly').default;
      
      // Manually disable the service
      countlyService.reset();
      countlyService['isDisabled'] = true;
      
      countlyService.trackEvent('test_event', { prop1: 'value1' });
      
      expect(Countly.events.recordEvent).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Analytics event skipped - service is disabled',
        context: { eventName: 'test_event', properties: { prop1: 'value1' } },
      });
    });
  });

  describe('error handling', () => {
    it('should handle tracking errors gracefully', () => {
      const Countly = require('@/lib/countly').default;
      Countly.events.recordEvent.mockImplementation(() => {
        throw new Error('Network error');
      });

      countlyService.reset();
      countlyService.trackEvent('test_event');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Analytics tracking error',
        context: {
          error: 'Network error',
          eventName: 'test_event',
          properties: {},
          retryCount: 1,
          maxRetries: 2,
          willDisable: false,
        },
      });
    });

    it('should disable after max retries', () => {
      const Countly = require('@/lib/countly').default;
      Countly.events.recordEvent.mockImplementation(() => {
        throw new Error('Network error');
      });

      countlyService.reset();

      // Trigger max retries
      countlyService.trackEvent('test_event');
      countlyService.trackEvent('test_event');

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Analytics temporarily disabled due to errors',
        context: {
          retryCount: 2,
          disableTimeoutMinutes: 10,
        },
      });

      expect(countlyService.isAnalyticsDisabled()).toBe(true);
    });

    it('should re-enable after timeout', () => {
      const Countly = require('@/lib/countly').default;
      Countly.events.recordEvent.mockImplementation(() => {
        throw new Error('Network error');
      });

      countlyService.reset();

      // Trigger max retries to disable service
      countlyService.trackEvent('test_event');
      countlyService.trackEvent('test_event');

      expect(countlyService.isAnalyticsDisabled()).toBe(true);

      // Fast-forward time to trigger re-enable
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Analytics re-enabled after recovery',
        context: {
          note: 'Analytics service has been restored and is ready for use',
        },
      });

      expect(countlyService.isAnalyticsDisabled()).toBe(false);
    });
  });

  describe('service management', () => {
    it('should provide status information', () => {
      const status = countlyService.getStatus();
      
      expect(status).toEqual({
        retryCount: expect.any(Number),
        isDisabled: expect.any(Boolean),
        maxRetries: 2,
        disableTimeoutMinutes: 10,
      });
    });

    it('should reset properly', () => {
      const Countly = require('@/lib/countly').default;
      Countly.events.recordEvent.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Cause some errors first
      countlyService.trackEvent('test_event');
      countlyService.trackEvent('test_event');
      
      expect(countlyService.isAnalyticsDisabled()).toBe(true);
      
      // Reset should clear the state
      countlyService.reset();
      
      expect(countlyService.isAnalyticsDisabled()).toBe(false);
      expect(countlyService.getStatus().retryCount).toBe(0);
    });
  });
});
