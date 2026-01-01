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
  error: Error | null;
  connectUpdateHub: () => Promise<void>;
  disconnectUpdateHub: () => Promise<void>;
  reconnectUpdateHub: () => Promise<void>;
  checkConnectionState: () => boolean;
}

export const useSignalRStore = create<SignalRState>((set, get) => ({
  isUpdateHubConnected: false,
  lastUpdateMessage: null,
  lastUpdateTimestamp: 0,
  error: null,
  connectUpdateHub: async () => {
    try {
      if (get().isUpdateHubConnected) {
        return;
      }

      set({ isUpdateHubConnected: false, error: null });

      // Get the eventing URL from the core store config
      const coreState = useCoreStore.getState();
      const eventingUrl = coreState.config?.EventingUrl;

      if (!eventingUrl) {
        const errorMessage = 'EventingUrl not available in config. Please ensure config is loaded first.';
        logger.error({
          message: errorMessage,
        });
        set({ error: new Error(errorMessage) });
        return;
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
}));
