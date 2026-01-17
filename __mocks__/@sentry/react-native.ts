/**
 * Mock for @sentry/react-native
 * Used during testing to prevent actual Sentry calls
 */

const mockScope = {
  setExtra: jest.fn(),
  setTag: jest.fn(),
  setLevel: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
};

const mockSentry = {
  init: jest.fn(),
  wrap: jest.fn((component: any) => component),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  captureEvent: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: typeof mockScope) => void) => {
    callback(mockScope);
  }),
  startSpan: jest.fn((options: any, callback: () => any) => callback()),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
    setStatus: jest.fn(),
    setData: jest.fn(),
    startChild: jest.fn(() => ({
      finish: jest.fn(),
    })),
  })),
  reactNavigationIntegration: jest.fn(() => ({
    registerNavigationContainer: jest.fn(),
  })),
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Log: 'log',
    Info: 'info',
    Debug: 'debug',
  },
};

export default mockSentry;
module.exports = mockSentry;
