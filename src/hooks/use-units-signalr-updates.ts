import { useEffect } from 'react';

import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitsStore } from '@/stores/units/store';

/**
 * Hook to listen for SignalR updates and refresh units widget data
 */
export const useUnitsSignalRUpdates = () => {
  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const fetchUnits = useUnitsStore((state) => state.fetchUnits);

  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Debounce bursts of SignalR messages into a single refresh
      const timer = setTimeout(() => {
        fetchUnits();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastUpdateTimestamp, fetchUnits]);
};
