import { Platform } from 'react-native';

import { logger } from '../lib/logging';

/**
 * Global app initialization service that handles one-time setup operations
 * This service should be called during app startup to ensure all critical
 * services are properly initialized before they're needed.
 */
class AppInitializationService {
  private static instance: AppInitializationService | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  /**
   * Initialize all global services
   * This method is idempotent and safe to call multiple times
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug({
        message: 'App initialization already completed, skipping',
      });
      return;
    }

    // If initialization is already in progress, wait for it to complete
    if (this.initializationPromise) {
      logger.debug({
        message: 'App initialization already in progress, waiting for completion',
      });
      return this.initializationPromise;
    }

    // Start initialization process
    this.initializationPromise = this._doInitialization();

    try {
      await this.initializationPromise;
      this.isInitialized = true;
      logger.info({
        message: 'App initialization completed successfully',
      });
    } catch (error) {
      logger.error({
        message: 'App initialization failed',
        context: { error },
      });
      // Reset the promise so initialization can be retried
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Internal initialization logic
   */
  private async _doInitialization(): Promise<void> {
    logger.info({
      message: 'Starting app initialization',
    });

    // Initialize CallKeep for iOS background audio support
    await this._initializeCallKeep();

    // Add other global initialization tasks here as needed
    // e.g., analytics, crash reporting, background services, etc.
  }

  /**
   * Initialize CallKeep service for iOS
   */
  private async _initializeCallKeep(): Promise<void> {
    if (Platform.OS !== 'ios') {
      logger.debug({
        message: 'CallKeep initialization skipped - not iOS platform',
        context: { platform: Platform.OS },
      });
      return;
    }

    try {
      logger.info({
        message: 'CallKeep initialized successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize CallKeep',
        context: { error },
      });
      // Don't throw here - CallKeep failure shouldn't prevent app startup
      // but LiveKit calls may not work properly in the background
    }
  }

  /**
   * Check if the service has been initialized
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset initialization state (for testing purposes)
   */
  reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    logger.debug({
      message: 'App initialization service reset',
    });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      this.isInitialized = false;
      this.initializationPromise = null;

      logger.info({
        message: 'App initialization service cleaned up',
      });
    } catch (error) {
      logger.error({
        message: 'Error during app initialization service cleanup',
        context: { error },
      });
    }
  }
}

// Export singleton instance
export const appInitializationService = AppInitializationService.getInstance();
