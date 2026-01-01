import { Platform } from 'react-native';

interface CountlyEvents {
  recordEvent: (eventName: string, segmentation: Record<string, string>, count: number) => void;
}

interface CountlyInterface {
  events: CountlyEvents;
  init?: (config: any) => Promise<void>;
  initWithConfig?: (config: any) => Promise<void>;
  start?: () => Promise<void>;
  enableCrashReporting?: () => Promise<void>;
}

/**
 * Platform-aware Countly wrapper
 * Provides a no-op implementation for web platform
 */
let Countly: CountlyInterface;

if (Platform.OS === 'web') {
  // Web fallback - no-op implementation
  Countly = {
    events: {
      recordEvent: () => {
        // No-op for web
        // Could optionally send to a web analytics service here
      },
    },
    init: async () => {
      // No-op
    },
    initWithConfig: async () => {
      // No-op
    },
    start: async () => {
      // No-op
    },
    enableCrashReporting: async () => {
      // No-op
    },
  };
} else {
  // Native platforms (iOS/Android)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Countly = require('countly-sdk-react-native-bridge').default;
}

export default Countly;
