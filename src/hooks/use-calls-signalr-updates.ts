import { useEffect } from 'react';

import { useCallsStore } from '@/stores/calls/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

/**
 * Hook to listen for SignalR updates and refresh calls widget data
 */
export const useCallsSignalRUpdates = () => {
  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const { init } = useCallsStore();

  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Refresh calls data when SignalR update is received
      init();
    }
  }, [lastUpdateTimestamp, init]);
};
