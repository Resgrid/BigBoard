import { useEffect } from 'react';

import { useSignalRStore } from '@/stores/signalr/signalr-store';
import { useUnitAlertAcknowledgementsStore } from '@/stores/units/unit-alert-acknowledgements-store';

/**
 * The department's unit status timer acknowledgements, kept current.
 *
 * Refetches on mount and whenever units change: a status change ends the episode an acknowledgement covered,
 * and a hub re-join (which bumps the units stamp) may have missed `unitStatusAlertUpdated` pushes. The push
 * itself refetches directly from the SignalR store.
 *
 * Pass `enabled = false` when the department has no status timers, so boards that never alert never ask.
 */
export const useUnitAlertAcknowledgements = (enabled: boolean) => {
  const lastUnitsTimestamp = useSignalRStore((state) => state.lastUnitsTimestamp);
  const acknowledgements = useUnitAlertAcknowledgementsStore((state) => state.acknowledgements);
  const fetchAcknowledgements = useUnitAlertAcknowledgementsStore((state) => state.fetchAcknowledgements);

  useEffect(() => {
    if (enabled) {
      fetchAcknowledgements();
    }
  }, [enabled, fetchAcknowledgements]);

  useEffect(() => {
    if (!enabled || lastUnitsTimestamp <= 0) {
      return;
    }

    // Same debounce as the units refresh, so a burst of status changes costs one request.
    const timer = setTimeout(() => {
      fetchAcknowledgements();
    }, 1500);

    return () => clearTimeout(timer);
  }, [enabled, lastUnitsTimestamp, fetchAcknowledgements]);

  return acknowledgements;
};
