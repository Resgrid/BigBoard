import { consoleTransport, logger as rnLogger } from 'react-native-logs';

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

class LogService {
  private static instance: LogService;
  private logger: any;
  private globalContext: Record<string, unknown> = {};

  private constructor() {
    this.logger = rnLogger.createLogger(config as any);
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  private log(level: LogLevel, { message, context = {} }: LogEntry): void {
    this.logger[level](message, {
      ...this.globalContext,
      ...context,
      timestamp: new Date().toISOString(),
    });
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
}

// Export singleton instance
export const logger = LogService.getInstance();

// React hook for component usage
export const useLogger = (): Logger => {
  return {
    debug: (entry: LogEntry) => logger.debug(entry),
    info: (entry: LogEntry) => logger.info(entry),
    warn: (entry: LogEntry) => logger.warn(entry),
    error: (entry: LogEntry) => logger.error(entry),
  };
};
