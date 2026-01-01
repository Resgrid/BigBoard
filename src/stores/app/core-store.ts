import { Env } from '@env';
import _ from 'lodash';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getConfig } from '@/api/config';
import { logger } from '@/lib/logging';
import { GetConfigResultData } from '@/models/v4/configs/getConfigResultData';

interface CoreState {
  config: GetConfigResultData | null;

  isLoading: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  init: () => Promise<void>;
  fetchConfig: () => Promise<void>;
}

export const useCoreStore = create<CoreState>()((set, get) => ({
  config: null,
  isLoading: false,
  isInitialized: false,
  isInitializing: false,
  error: null,
  activeStatuses: null,
  init: async () => {
    const state = get();

    // Prevent multiple simultaneous initializations
    if (state.isInitializing) {
      logger.info({
        message: 'Core store initialization already in progress, skipping',
      });
      return;
    }

    // Don't re-initialize if already initialized
    if (state.isInitialized) {
      logger.info({
        message: 'Core store already initialized, skipping',
      });
      return;
    }

    set({ isLoading: true, isInitializing: true, error: null });

    try {
      logger.info({
        message: 'Core store init: About to fetch config',
      });

      // Fetch config first before anything else - this is critical for SignalR connections
      const config = await getConfig(Env.APP_KEY);

      logger.info({
        message: 'Config fetched successfully',
      });

      set({
        isInitialized: true,
        isLoading: false,
        isInitializing: false,
        config: config.Data,
        error: null,
      });

      logger.info({
        message: 'Core store initialization completed successfully',
      });
    } catch (error) {
      set({
        error: 'Failed to init core app data',
        isLoading: false,
        isInitializing: false,
      });
      logger.error({
        message: `Failed to init core app data: ${JSON.stringify(error)}`,
        context: { error },
      });
    }
  },
  fetchConfig: async () => {
    logger.info({
      message: 'fetchConfig: Starting config fetch',
    });
    try {
      logger.info({
        message: 'fetchConfig: Calling getConfig API',
        context: { appKey: Env.APP_KEY },
      });

      const config = await getConfig(Env.APP_KEY);

      logger.info({
        message: 'fetchConfig: Config API call completed',
        context: { hasData: !!config.Data },
      });

      logger.info({
        message: 'fetchConfig: About to update store',
      });

      set({ config: config.Data, error: null });

      logger.info({
        message: 'fetchConfig: Store updated with config',
      });
    } catch (error) {
      logger.error({
        message: 'fetchConfig: Error occurred',
        context: { error: String(error) },
      });

      set({ error: 'Failed to fetch config', isLoading: false });

      logger.error({
        message: `Failed to fetch config: ${JSON.stringify(error)}`,
        context: { error },
      });
      throw error; // Re-throw to allow calling code to handle
    }
  },
}));
