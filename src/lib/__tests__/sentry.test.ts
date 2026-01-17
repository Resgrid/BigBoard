import { Platform } from 'react-native';

// Mock @sentry/react-native BEFORE importing the module under test
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const mockScope = {
      setExtra: jest.fn(),
      setLevel: jest.fn(),
    };
    callback(mockScope);
    return mockScope;
  }),
  startSpan: jest.fn((options: any, callback: () => any) => callback()),
}));

// Now import the module under test
import * as SentryReactNative from '@sentry/react-native';
import { sentryService, captureException, captureMessage, setUser, setTag, addBreadcrumb } from '../sentry';

describe('SentryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mark as initialized for tests
    sentryService.setInitialized();
  });

  describe('when initialized', () => {
    it('should capture exceptions', () => {
      const error = new Error('Test error');
      captureException(error);

      expect(SentryReactNative.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture exceptions with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      captureException(error, context);

      expect(SentryReactNative.withScope).toHaveBeenCalled();
      expect(SentryReactNative.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture messages', () => {
      captureMessage('Test message', 'info');

      expect(SentryReactNative.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture messages with context', () => {
      const context = { data: 'test' };
      sentryService.captureMessage('Test message', 'warning', context);

      expect(SentryReactNative.withScope).toHaveBeenCalled();
    });

    it('should set user', () => {
      const user = { id: '123', email: 'test@example.com' };
      setUser(user);

      expect(SentryReactNative.setUser).toHaveBeenCalledWith(user);
    });

    it('should set user to null', () => {
      setUser(null);

      expect(SentryReactNative.setUser).toHaveBeenCalledWith(null);
    });

    it('should set tags', () => {
      setTag('version', '1.0.0');

      expect(SentryReactNative.setTag).toHaveBeenCalledWith('version', '1.0.0');
    });

    it('should add breadcrumbs', () => {
      const breadcrumb = {
        category: 'navigation',
        message: 'User navigated to home',
        level: 'info' as const,
      };
      addBreadcrumb(breadcrumb);

      expect(SentryReactNative.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'navigation',
          message: 'User navigated to home',
          level: 'info',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should set context', () => {
      const context = { key: 'value' };
      sentryService.setContext('test', context);

      expect(SentryReactNative.setContext).toHaveBeenCalledWith('test', context);
    });

    it('should execute startSpan callback', () => {
      const callback = jest.fn(() => 'result');
      const result = sentryService.startSpan('Test Span', 'test.operation', callback);

      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should return correct platform', () => {
      const platform = sentryService.getPlatform();
      expect(['ios', 'android', 'web']).toContain(platform);
    });

    it('should report initialized state', () => {
      expect(sentryService.getIsInitialized()).toBe(true);
    });
  });
});

describe('SentryService - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sentryService.setInitialized();
  });

  it('should handle captureException errors gracefully', () => {
    (SentryReactNative.captureException as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sentry error');
    });

    // Should not throw
    expect(() => captureException(new Error('Test'))).not.toThrow();
  });

  it('should handle captureMessage errors gracefully', () => {
    (SentryReactNative.captureMessage as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sentry error');
    });

    // Should not throw
    expect(() => captureMessage('Test message')).not.toThrow();
  });

  it('should handle setUser errors gracefully', () => {
    (SentryReactNative.setUser as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sentry error');
    });

    // Should not throw
    expect(() => setUser({ id: '123' })).not.toThrow();
  });

  it('should handle setTag errors gracefully', () => {
    (SentryReactNative.setTag as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sentry error');
    });

    // Should not throw
    expect(() => setTag('key', 'value')).not.toThrow();
  });

  it('should handle addBreadcrumb errors gracefully', () => {
    (SentryReactNative.addBreadcrumb as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sentry error');
    });

    // Should not throw
    expect(() => addBreadcrumb({ message: 'test' })).not.toThrow();
  });
});
