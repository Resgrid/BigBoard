/**
 * Mock for Countly React Native SDK
 * Used during testing to prevent actual analytics calls
 *
 * NOTE: The actual app now uses @/lib/countly which provides
 * platform-aware initialization. This mock is kept for backward
 * compatibility with any remaining direct imports.
 */

const mockCountly = {
  init: jest.fn().mockResolvedValue(undefined),
  initWithConfig: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  enableCrashReporting: jest.fn().mockResolvedValue(undefined),
  events: {
    recordEvent: jest.fn().mockResolvedValue(undefined),
  },
};

export default mockCountly;
