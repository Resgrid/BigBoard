import { logger } from '@/lib/logging';

/**
 * Background Geolocation Storage
 * Manages background geolocation state persistence
 */

export interface BackgroundGeolocationState {
  isEnabled: boolean;
  lastPosition: {
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null;
}

export const loadBackgroundGeolocationState = async (): Promise<BackgroundGeolocationState> => {
  logger.info({ message: 'Loading background geolocation state' });
  return {
    isEnabled: false,
    lastPosition: null,
  };
};

export const saveBackgroundGeolocationState = async (state: BackgroundGeolocationState): Promise<void> => {
  logger.info({ message: 'Saving background geolocation state', context: { state } });
};
