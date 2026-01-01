import { useEffect } from 'react';

import { usePersonnelStore } from '@/stores/personnel/store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

/**
 * Hook to listen for SignalR updates and refresh personnel widget data
 */
export const usePersonnelSignalRUpdates = () => {
  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const { fetchPersonnel } = usePersonnelStore();

  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Refresh personnel data when SignalR update is received
      fetchPersonnel();
    }
  }, [lastUpdateTimestamp, fetchPersonnel]);
};
