import { useCallback, useEffect } from 'react';

import { logger } from '@/lib/logging';
import { type SignalRHubConfig, signalRService } from '@/services/signalr.service';

export const useSignalR = (config: SignalRHubConfig) => {
  const connect = useCallback(async () => {
    try {
      await signalRService.connectToHub(config);
    } catch (error) {
      logger.error({
        message: 'Failed to connect to SignalR hub',
        context: { error, config },
      });
    }
  }, [config]);

  const disconnect = useCallback(async () => {
    try {
      await signalRService.disconnectFromHub(config.name);
    } catch (error) {
      logger.error({
        message: 'Failed to disconnect from SignalR hub',
        context: { error, config },
      });
    }
  }, [config]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
  };
};
