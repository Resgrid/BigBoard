import { useEffect } from 'react';

import { usePersonnelStore } from '@/stores/personnel/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

/**
 * Hook to listen for SignalR updates and refresh personnel widget data
 */
export const usePersonnelSignalRUpdates = () => {
  const lastPersonnelTimestamp = useSignalRStore((state) => state.lastPersonnelTimestamp);
  const fetchPersonnel = usePersonnelStore((state) => state.fetchPersonnel);

  useEffect(() => {
    if (lastPersonnelTimestamp > 0) {
      // Debounce bursts of SignalR messages into a single refresh
      const timer = setTimeout(() => {
        fetchPersonnel();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastPersonnelTimestamp, fetchPersonnel]);
};
