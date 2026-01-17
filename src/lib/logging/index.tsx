import { consoleTransport, logger as rnLogger } from 'react-native-logs';

import { addBreadcrumb, captureException, captureMessage, sentryService } from '../sentry';
import type { LogEntry, Logger, LogLevel } from './types';

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: __DEV__ ? 'debug' : 'warn',
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'gray',
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  fixedExtLvlLength: false,
  enabled: true,
};

interface LogServiceOptions {
  /** Whether to send errors to Sentry (default: true in production) */
  enableSentryIntegration?: boolean;
  /** Minimum level to send to Sentry (default: 'error') */
  sentryMinLevel?: LogLevel;
}

class LogService {
  private static instance: LogService;
  private logger: any;
  private globalContext: Record<string, unknown> = {};
  private enableSentryIntegration: boolean;
  private sentryMinLevel: LogLevel;

  private constructor(options: LogServiceOptions = {}) {
    this.logger = rnLogger.createLogger(config as any);
    this.enableSentryIntegration = options.enableSentryIntegration ?? !__DEV__;
    this.sentryMinLevel = options.sentryMinLevel ?? 'error';
  }

  public static getInstance(options?: LogServiceOptions): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService(options);
    } else if (__DEV__ && options !== undefined) {
      console.warn(
        '[LogService] Options were passed to getInstance() but are being ignored because the instance already exists. ' +
        'Configure options on the first call to getInstance() only.'
      );
    }
    return LogService.instance;
  }

  private shouldSendToSentry(level: LogLevel): boolean {
    if (!this.enableSentryIntegration || !sentryService.getIsInitialized()) {
      return false;
    }

    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levelPriority[level] >= levelPriority[this.sentryMinLevel];
  }

  private serializeContextForSentry(context: Record<string, unknown>): Record<string, string | number | boolean | null | undefined> {
    const sentryContext: Record<string, string | number | boolean | null | undefined> = {};
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        sentryContext[key] = value;
      } else {
        sentryContext[key] = JSON.stringify(value);
      }
    });
    return sentryContext;
  }

  private log(level: LogLevel, { message, context = {} }: LogEntry): void {
    const fullContext = {
      ...this.globalContext,
      ...context,
      timestamp: new Date().toISOString(),
    };

    // Log to console
    this.logger[level](message, fullContext);

    // Send to Sentry based on level
    if (this.shouldSendToSentry(level)) {
      const sentryContext = this.serializeContextForSentry(fullContext);

      if (level === 'error') {
        // Check if context contains an error object
        const errorInContext = context.error;
        if (errorInContext instanceof Error) {
          captureException(errorInContext, sentryContext);
        } else {
          captureMessage(message, 'error', sentryContext);
        }
      } else if (level === 'warn') {
        captureMessage(message, 'warning', sentryContext);
      }
    }

    // Add breadcrumb for all logs (useful for debugging)
    if (sentryService.getIsInitialized()) {
      addBreadcrumb({
        category: 'log',
        message,
        level: level === 'warn' ? 'warning' : level,
        data: fullContext,
      });
    }
  }

  public setGlobalContext(context: Record<string, unknown>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  public clearGlobalContext(): void {
    this.globalContext = {};
  }

  public debug(entry: LogEntry): void {
    this.log('debug', entry);
  }

  public info(entry: LogEntry): void {
    this.log('info', entry);
  }

  public warn(entry: LogEntry): void {
    this.log('warn', entry);
  }

  public error(entry: LogEntry): void {
    this.log('error', entry);
  }

  /**
   * Log an error with automatic Sentry capture
   * @param error The error to log
   * @param message A descriptive message
   * @param context Additional context
   */
  public captureError(error: Error | unknown, message: string, context: Record<string, unknown> = {}): void {
    // Store the actual Error object so instanceof check in log() works
    const errorContext = {
      ...context,
      error: error instanceof Error ? error : new Error(String(error)),
      stack: error instanceof Error ? error.stack : undefined,
    };

    this.log('error', {
      message,
      context: errorContext,
    });

    // Note: log() already handles captureException when error instanceof Error,
    // so we don't need to call it again here to avoid double-reporting
  }
}

// Export singleton instance
export const logger = LogService.getInstance();

// React hook for component usage
export const useLogger = (): Logger & { captureError: typeof logger.captureError } => {
  return {
    debug: (entry: LogEntry) => logger.debug(entry),
    info: (entry: LogEntry) => logger.info(entry),
    warn: (entry: LogEntry) => logger.warn(entry),
    error: (entry: LogEntry) => logger.error(entry),
    captureError: (error: Error | unknown, message: string, context?: Record<string, unknown>) => logger.captureError(error, message, context),
  };
};
