import * as SentryReactNative from '@sentry/react-native';
import { Platform } from 'react-native';

/**
 * Platform-aware Sentry wrapper
 * Provides unified error reporting interface across iOS, Android, and Web
 */

export interface SentryContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: string | undefined;
}

export interface SentryBreadcrumb {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Sentry service for unified error tracking across platforms
 */
class SentryService {
  private static instance: SentryService;
  private isInitialized = false;

  private constructor() {
    // Singleton
  }

  public static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  /**
   * Check if Sentry has been initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Mark Sentry as initialized (called from _layout.tsx after Sentry.init)
   */
  public setInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Capture an exception with optional context
   */
  public captureException(error: Error | unknown, context?: SentryContext): void {
    if (!this.isInitialized) {
      if (__DEV__) {
        console.warn('[Sentry] Cannot capture exception - Sentry not initialized');
      }
      return;
    }

    try {
      if (context) {
        SentryReactNative.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          SentryReactNative.captureException(error);
        });
      } else {
        SentryReactNative.captureException(error);
      }
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to capture exception:', e);
      }
    }
  }

  /**
   * Capture a message with optional level and context
   */
  public captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', context?: SentryContext): void {
    if (!this.isInitialized) {
      if (__DEV__) {
        console.warn('[Sentry] Cannot capture message - Sentry not initialized');
      }
      return;
    }

    try {
      if (context) {
        SentryReactNative.withScope((scope) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          scope.setLevel(level);
          SentryReactNative.captureMessage(message);
        });
      } else {
        SentryReactNative.captureMessage(message, level);
      }
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to capture message:', e);
      }
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUser(user: SentryUser | null): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      SentryReactNative.setUser(user);
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to set user:', e);
      }
    }
  }

  /**
   * Set extra context data
   */
  public setContext(name: string, context: SentryContext | null): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      SentryReactNative.setContext(name, context);
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to set context:', e);
      }
    }
  }

  /**
   * Set a tag
   */
  public setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      SentryReactNative.setTag(key, value);
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to set tag:', e);
      }
    }
  }

  /**
   * Add a breadcrumb for debugging
   */
  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      SentryReactNative.addBreadcrumb({
        ...breadcrumb,
        timestamp: Date.now() / 1000,
      });
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to add breadcrumb:', e);
      }
    }
  }

  /**
   * Start a new span for performance monitoring
   */
  public startSpan<T>(name: string, operation: string, callback: () => T | Promise<T>): T | Promise<T> {
    if (!this.isInitialized) {
      return callback();
    }

    try {
      return SentryReactNative.startSpan(
        {
          name,
          op: operation,
        },
        callback
      );
    } catch (e) {
      if (__DEV__) {
        console.error('[Sentry] Failed to start span:', e);
      }
      return callback();
    }
  }

  /**
   * Get the current platform for tagging
   */
  public getPlatform(): string {
    return Platform.OS;
  }
}

// Export singleton instance
export const sentryService = SentryService.getInstance();

// Re-export Sentry for advanced usage (like Sentry.wrap in _layout.tsx)
export { SentryReactNative as Sentry };

// Export commonly used functions directly
export const captureException = (error: Error | unknown, context?: SentryContext) => sentryService.captureException(error, context);

export const captureMessage = (message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug', context?: SentryContext) => sentryService.captureMessage(message, level, context);

export const setUser = (user: SentryUser | null) => sentryService.setUser(user);

export const setContext = (name: string, context: SentryContext | null) => sentryService.setContext(name, context);

export const setTag = (key: string, value: string) => sentryService.setTag(key, value);

export const addBreadcrumb = (breadcrumb: SentryBreadcrumb) => sentryService.addBreadcrumb(breadcrumb);
