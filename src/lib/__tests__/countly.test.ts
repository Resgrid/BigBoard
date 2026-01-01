/**
 * Tests for the platform-aware Countly wrapper
 *
 * Note: These tests verify that the wrapper provides appropriate
 * implementations for different platforms. The actual platform detection
 * happens at module load time, so we can only test the default behavior
 * (which is determined by the current test environment).
 */

describe('Countly Platform Wrapper', () => {
  it('should provide Countly interface with required methods', () => {
    const Countly = require('../countly').default;

    expect(Countly).toBeDefined();
    expect(Countly.events).toBeDefined();
    expect(Countly.events.recordEvent).toBeDefined();
    expect(typeof Countly.events.recordEvent).toBe('function');
  });

  it('should have optional init methods', () => {
    const Countly = require('../countly').default;

    // These methods should exist
    expect(Countly.init).toBeDefined();
    expect(Countly.initWithConfig).toBeDefined();
    expect(Countly.start).toBeDefined();
    expect(Countly.enableCrashReporting).toBeDefined();
  });

  it('should handle recordEvent calls without throwing', () => {
    const Countly = require('../countly').default;

    // Should not throw for basic event recording
    expect(() => {
      Countly.events.recordEvent('test_event', { prop: 'value' }, 1);
    }).not.toThrow();
  });

  it('should handle async method calls without throwing', async () => {
    const Countly = require('../countly').default;

    // Should not throw when calling async methods
    const callAsync = async () => {
      if (Countly.init) {
        await Countly.init({});
      }
      if (Countly.initWithConfig) {
        await Countly.initWithConfig({});
      }
      if (Countly.start) {
        await Countly.start();
      }
      if (Countly.enableCrashReporting) {
        await Countly.enableCrashReporting();
      }
    };

    await expect(callAsync()).resolves.not.toThrow();
  });
});

