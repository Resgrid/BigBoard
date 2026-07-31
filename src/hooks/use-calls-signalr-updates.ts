import { useEffect } from 'react';

import { useCallsStore } from '@/stores/calls/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

/**
 * Hook to listen for SignalR updates and refresh calls widget data
 */
export const useCallsSignalRUpdates = () => {
  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const init = useCallsStore((state) => state.init);

  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Debounce bursts of SignalR messages into a single refresh
      const timer = setTimeout(() => {
        init();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, init]);
};
