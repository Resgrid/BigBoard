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
 * Web Countly implementation using window.Countly
 * This provides basic analytics tracking for web platform
 */
class CountlyWebImplementation implements CountlyInterface {
  private isInitialized = false;
  private appKey: string | null = null;
  private serverUrl: string | null = null;
  private pendingEvents: { eventName: string; segmentation: Record<string, string>; count: number }[] = [];

  events: CountlyEvents = {
    recordEvent: (eventName: string, segmentation: Record<string, string>, count: number) => {
      if (!this.isInitialized) {
        // Queue events if not initialized yet
        this.pendingEvents.push({ eventName, segmentation, count });
        return;
      }

      try {
        // Use window.Countly if available (from Countly Web SDK)
        if (typeof window !== 'undefined' && (window as any).Countly) {
          (window as any).Countly.q.push([
            'add_event',
            {
              key: eventName,
              count: count,
              segmentation: segmentation,
            },
          ]);
        } else if (__DEV__) {
          // Log to console in development for debugging
          console.log('[Countly Web] Event:', eventName, segmentation);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Countly Web] Failed to record event:', error);
        }
      }
    },
  };

  async init(config: { appKey: string; url: string }): Promise<void> {
    return this.initWithConfig(config);
  }

  async initWithConfig(config: { appKey?: string; url?: string } | any): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Extract config values (handle both object formats)
      this.appKey = config.appKey || config.app_key;
      this.serverUrl = config.url || config.server_url;

      if (!this.appKey || !this.serverUrl) {
        if (__DEV__) {
          console.warn('[Countly Web] Missing appKey or serverUrl, skipping initialization');
        }
        return;
      }

      // Initialize Countly Web SDK if available
      if (typeof window !== 'undefined') {
        // Load Countly Web SDK dynamically
        await this.loadCountlyWebSDK();

        if ((window as any).Countly) {
          const CountlyWeb = (window as any).Countly;

          // Initialize queue if not exists
          CountlyWeb.q = CountlyWeb.q || [];

          // Initialize with configuration
          CountlyWeb.app_key = this.appKey;
          CountlyWeb.url = this.serverUrl;

          // Push init command
          CountlyWeb.q.push(['track_sessions']);
          CountlyWeb.q.push(['track_pageview']);
          CountlyWeb.q.push(['track_errors']);

          this.isInitialized = true;

          // Process any pending events
          this.processPendingEvents();

          if (__DEV__) {
            console.log('[Countly Web] Initialized successfully');
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[Countly Web] Initialization failed:', error);
      }
    }
  }

  private async loadCountlyWebSDK(): Promise<void> {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).Countly) {
      return;
    }

    // If not loaded, create a minimal implementation
    if (typeof window !== 'undefined' && !(window as any).Countly) {
      (window as any).Countly = {
        q: [] as any[],
        app_key: '',
        url: '',
      };

      // Try to load the official SDK from CDN
      try {
        if (this.serverUrl) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = `${this.serverUrl}/sdk/web/countly.min.js`;
          script.onload = () => {
            if (__DEV__) {
              console.log('[Countly Web] SDK loaded from server');
            }
          };
          script.onerror = () => {
            if (__DEV__) {
              console.warn('[Countly Web] Failed to load SDK, using fallback');
            }
          };
          const firstScript = document.getElementsByTagName('script')[0];
          if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
          } else {
            document.head.appendChild(script);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Countly Web] Failed to load SDK:', error);
        }
      }
    }
  }

  private processPendingEvents(): void {
    if (this.pendingEvents.length > 0) {
      const events = [...this.pendingEvents];
      this.pendingEvents = [];
      events.forEach(({ eventName, segmentation, count }) => {
        this.events.recordEvent(eventName, segmentation, count);
      });
    }
  }

  async start(): Promise<void> {
    // Web SDK auto-starts after initialization
  }

  async enableCrashReporting(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).Countly) {
      (window as any).Countly.q.push(['track_errors']);
    }
  }
}

/**
 * Platform-aware Countly wrapper
 * Provides web SDK implementation for web platform and native bridge for iOS/Android
 */
let Countly: CountlyInterface;

if (Platform.OS === 'web') {
  // Web platform - use web SDK implementation
  Countly = new CountlyWebImplementation();
} else {
  // Native platforms (iOS/Android)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Countly = require('countly-sdk-react-native-bridge').default;
}

export default Countly;

// Export for direct access if needed
export { CountlyWebImplementation };
