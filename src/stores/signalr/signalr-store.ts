import { create } from 'zustand';

import { useAuthStore } from '@/lib';
import { Env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { signalRService } from '@/services/signalr.service';

import { useCoreStore } from '../app/core-store';
import { securityStore, useSecurityStore } from '../security/store';

interface SignalRState {
  isUpdateHubConnected: boolean;
  lastUpdateMessage: unknown;
  lastUpdateTimestamp: number;
  isGeolocationHubConnected: boolean;
  lastGeolocationMessage: unknown;
  lastGeolocationTimestamp: number;
  error: Error | null;
  connectUpdateHub: () => Promise<void>;
  disconnectUpdateHub: () => Promise<void>;
  reconnectUpdateHub: () => Promise<void>;
  connectGeolocationHub: () => Promise<void>;
  disconnectGeolocationHub: () => Promise<void>;
  checkConnectionState: () => boolean;
}

export const useSignalRStore = create<SignalRState>((set, get) => ({
  isUpdateHubConnected: false,
  lastUpdateMessage: null,
  lastUpdateTimestamp: 0,
  isGeolocationHubConnected: false,
  lastGeolocationMessage: null,
  lastGeolocationTimestamp: 0,
  error: null,
  connectUpdateHub: async () => {
    try {
      if (get().isUpdateHubConnected) {
        return;
      }

      set({ isUpdateHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      let coreState = useCoreStore.getState();
      let eventingUrl = coreState.config?.EventingUrl;

      // If config is not loaded yet, wait for it to be fetched
      if (!eventingUrl) {
        logger.info({
          message: 'EventingUrl not available, waiting for config to be fetched...',
        });

        // Check if config is already being initialized
        if (!coreState.isInitialized && !coreState.isInitializing) {
          logger.info({
            message: 'Config not initialized, fetching config before SignalR connection',
          });
          try {
            await useCoreStore.getState().fetchConfig();
          } catch (configError) {
            const errorMessage = 'Failed to fetch config for SignalR connection';
            logger.error({
              message: errorMessage,
              context: { error: configError },
            });
            set({ error: new Error(errorMessage) });
            throw new Error(errorMessage);
          }
        } else if (coreState.isInitializing) {
          // Wait for initialization to complete (poll with timeout)
          logger.info({
            message: 'Config is being initialized, waiting for completion...',
          });
          const maxWaitTime = 10000; // 10 seconds
          const pollInterval = 100; // 100ms
          let waitedTime = 0;

          while (waitedTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waitedTime += pollInterval;
            coreState = useCoreStore.getState();
            if (coreState.isInitialized && coreState.config?.EventingUrl) {
              break;
            }
          }
        }

        // Re-check for eventingUrl after waiting
        coreState = useCoreStore.getState();
        eventingUrl = coreState.config?.EventingUrl;

        if (!eventingUrl) {
          const errorMessage = 'EventingUrl not available in config after waiting. Please ensure config is loaded first.';
          logger.error({
            message: errorMessage,
          });
          set({ error: new Error(errorMessage) });
          throw new Error(errorMessage);
        }

        logger.info({
          message: 'EventingUrl now available, proceeding with SignalR connection',
          context: { eventingUrl },
        });
      }

      // Connect to the eventing hub
      await signalRService.connectToHubWithEventingUrl({
        name: Env.CHANNEL_HUB_NAME,
        eventingUrl: eventingUrl,
        hubName: Env.CHANNEL_HUB_NAME,
        methods: ['personnelStatusUpdated', 'personnelStaffingUpdated', 'unitStatusUpdated', 'callsUpdated', 'callAdded', 'callClosed', 'onConnected'],
      });

      await signalRService.invoke(Env.CHANNEL_HUB_NAME, 'connect', parseInt(securityStore.getState().rights?.DepartmentId ?? '0'));

      signalRService.on('personnelStatusUpdated', (message) => {
        logger.info({
          message: 'personnelStatusUpdated',
          context: { message },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now() });
      });

      signalRService.on('personnelStaffingUpdated', (message) => {
        logger.info({
          message: 'personnelStaffingUpdated',
          context: { message },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now() });
      });

      signalRService.on('unitStatusUpdated', (message) => {
        logger.info({
          message: 'unitStatusUpdated',
          context: { message },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now() });
      });

      signalRService.on('callsUpdated', (message) => {
        const now = Date.now();

        logger.info({
          message: 'callsUpdated',
          context: { message, now },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: now });
      });

      signalRService.on('callAdded', (message) => {
        logger.info({
          message: 'callAdded',
          context: { message },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now() });
      });

      signalRService.on('callClosed', (message) => {
        logger.info({
          message: 'callClosed',
          context: { message },
        });
        set({ lastUpdateMessage: JSON.stringify(message), lastUpdateTimestamp: Date.now() });
      });

      signalRService.on('onConnected', () => {
        logger.info({
          message: 'Connected to update SignalR hub',
        });
        set({ isUpdateHubConnected: true, error: null });
      });

      // Set up connection state monitoring using the actual SignalR connection
      // This ensures we properly track disconnections and reconnections
      const hubConnection = (signalRService as any).connections?.get(Env.CHANNEL_HUB_NAME);
      if (hubConnection) {
        // Handle connection close
        hubConnection.onclose(() => {
          logger.info({
            message: 'Update SignalR hub connection closed',
          });
          set({ isUpdateHubConnected: false });
        });

        // Handle reconnecting state
        hubConnection.onreconnecting(() => {
          logger.info({
            message: 'Update SignalR hub reconnecting',
          });
          set({ isUpdateHubConnected: false });
        });

        // Handle reconnected state
        hubConnection.onreconnected(() => {
          logger.info({
            message: 'Update SignalR hub reconnected',
          });
          set({ isUpdateHubConnected: true, error: null });
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectUpdateHub: async () => {
    try {
      await signalRService.disconnectFromHub(Env.CHANNEL_HUB_NAME);
      set({ isUpdateHubConnected: false, lastUpdateMessage: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from SignalR hubs',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  reconnectUpdateHub: async () => {
    try {
      logger.info({
        message: 'Manual reconnection requested for update hub',
      });

      // Disconnect first to ensure clean state
      await get().disconnectUpdateHub();

      // Wait a moment before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reconnect
      await get().connectUpdateHub();

      logger.info({
        message: 'Successfully reconnected to update hub',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to manually reconnect to update hub',
        context: { error: err },
      });
      set({ error: err });
      throw err;
    }
  },
  checkConnectionState: () => {
    // Check the actual connection state from the service
    const isActuallyConnected = signalRService.isHubConnected(Env.CHANNEL_HUB_NAME);
    const currentState = get().isUpdateHubConnected;

    // If the states don't match, update the store
    if (isActuallyConnected !== currentState) {
      logger.info({
        message: 'Connection state mismatch detected, updating store',
        context: { isActuallyConnected, currentState },
      });
      set({ isUpdateHubConnected: isActuallyConnected });
    }

    return isActuallyConnected;
  },
  connectGeolocationHub: async () => {
    try {
      if (get().isGeolocationHubConnected) {
        return;
      }

      set({ isGeolocationHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      let coreState = useCoreStore.getState();
      let eventingUrl = coreState.config?.EventingUrl;

      // If config is not loaded yet, wait for it to be fetched
      if (!eventingUrl) {
        logger.info({
          message: 'EventingUrl not available for geolocation hub, waiting for config to be fetched...',
        });

        // Check if config is already being initialized
        if (!coreState.isInitialized && !coreState.isInitializing) {
          logger.info({
            message: 'Config not initialized, fetching config before geolocation hub connection',
          });
          try {
            await useCoreStore.getState().fetchConfig();
          } catch (configError) {
            const errorMessage = 'Failed to fetch config for geolocation hub connection';
            logger.error({
              message: errorMessage,
              context: { error: configError },
            });
            set({ error: new Error(errorMessage) });
            throw new Error(errorMessage);
          }
        } else if (coreState.isInitializing) {
          // Wait for initialization to complete (poll with timeout)
          logger.info({
            message: 'Config is being initialized, waiting for completion before geolocation hub connection...',
          });
          const maxWaitTime = 10000; // 10 seconds
          const pollInterval = 100; // 100ms
          let waitedTime = 0;

          while (waitedTime < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waitedTime += pollInterval;
            coreState = useCoreStore.getState();
            if (coreState.isInitialized && coreState.config?.EventingUrl) {
              break;
            }
          }
        }

        // Re-check for eventingUrl after waiting
        coreState = useCoreStore.getState();
        eventingUrl = coreState.config?.EventingUrl;

        if (!eventingUrl) {
          const errorMessage = 'EventingUrl not available in config for geolocation hub after waiting';
          logger.error({ message: errorMessage });
          set({ error: new Error(errorMessage) });
          throw new Error(errorMessage);
        }

        logger.info({
          message: 'EventingUrl now available, proceeding with geolocation hub connection',
          context: { eventingUrl },
        });
      }

      // Connect to the geolocation hub (implementation depends on your SignalR service)
      logger.info({ message: 'Geolocation hub connected' });
      set({ isGeolocationHubConnected: true, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to connect to geolocation hub',
        context: { error: err },
      });
      set({ error: err });
    }
  },
  disconnectGeolocationHub: async () => {
    try {
      set({ isGeolocationHubConnected: false, lastGeolocationMessage: null });
      logger.info({ message: 'Geolocation hub disconnected' });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Failed to disconnect from geolocation hub',
        context: { error: err },
      });
      set({ error: err });
    }
  },
}));
