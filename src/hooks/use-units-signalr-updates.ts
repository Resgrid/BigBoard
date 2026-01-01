import { useEffect } from 'react';

import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitsStore } from '@/stores/units/store';

/**
 * Hook to listen for SignalR updates and refresh units widget data
 */
export const useUnitsSignalRUpdates = () => {
  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const { fetchUnits } = useUnitsStore();

  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      // Refresh units data when SignalR update is received
      fetchUnits();
    }
  }, [lastUpdateTimestamp, fetchUnits]);
};
