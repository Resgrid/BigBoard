import { useEffect } from 'react';

import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitsStore } from '@/stores/units/store';

/**
 * Hook to listen for SignalR updates and refresh units widget data
 */
export const useUnitsSignalRUpdates = () => {
  const lastUnitsTimestamp = useSignalRStore((state) => state.lastUnitsTimestamp);
  const fetchUnits = useUnitsStore((state) => state.fetchUnits);

  useEffect(() => {
    if (lastUnitsTimestamp > 0) {
      // Debounce bursts of SignalR messages into a single refresh
      const timer = setTimeout(() => {
        fetchUnits();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastUnitsTimestamp, fetchUnits]);
};
