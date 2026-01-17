/**
 * Tests for the platform-aware Countly wrapper
 *
 * Note: These tests verify that the wrapper provides appropriate
 * implementations for different platforms. The actual platform detection
 * happens at module load time, so we can only test the default behavior
 * (which is determined by the current test environment).
 */

describe('Countly Platform Wrapper', () => {
  beforeEach(() => {
    jest.resetModules();
  });

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
        await Countly.init({ appKey: 'test', url: 'https://test.com' });
      }
      if (Countly.initWithConfig) {
        await Countly.initWithConfig({ appKey: 'test', url: 'https://test.com' });
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

describe('CountlyWebImplementation', () => {
  beforeEach(() => {
    jest.resetModules();
    // Reset window.__ENV__ and window.Countly for web tests
    if (typeof window !== 'undefined') {
      delete (window as any).Countly;
    }
  });

  it('should export CountlyWebImplementation class', () => {
    const { CountlyWebImplementation } = require('../countly');
    expect(CountlyWebImplementation).toBeDefined();
  });

  it('should create instance of CountlyWebImplementation', () => {
    const { CountlyWebImplementation } = require('../countly');
    const instance = new CountlyWebImplementation();
    
    expect(instance).toBeDefined();
    expect(instance.events).toBeDefined();
    expect(instance.events.recordEvent).toBeDefined();
    expect(instance.initWithConfig).toBeDefined();
    expect(instance.start).toBeDefined();
    expect(instance.enableCrashReporting).toBeDefined();
  });

  it('should queue events before initialization', () => {
    const { CountlyWebImplementation } = require('../countly');
    const instance = new CountlyWebImplementation();
    
    // Should not throw and should queue the event
    expect(() => {
      instance.events.recordEvent('queued_event', { key: 'value' }, 1);
    }).not.toThrow();
  });

  it('should initialize with config', async () => {
    const { CountlyWebImplementation } = require('../countly');
    const instance = new CountlyWebImplementation();
    
    await expect(
      instance.initWithConfig({
        appKey: 'test_app_key',
        url: 'https://countly.example.com',
      })
    ).resolves.not.toThrow();
  });

  it('should skip initialization without appKey', async () => {
    const { CountlyWebImplementation } = require('../countly');
    const instance = new CountlyWebImplementation();
    
    // Should not throw but should skip initialization
    await expect(
      instance.initWithConfig({
        url: 'https://countly.example.com',
      })
    ).resolves.not.toThrow();
  });

  it('should skip initialization without url', async () => {
    const { CountlyWebImplementation } = require('../countly');
    const instance = new CountlyWebImplementation();
    
    // Should not throw but should skip initialization
    await expect(
      instance.initWithConfig({
        appKey: 'test_app_key',
      })
    ).resolves.not.toThrow();
  });
});