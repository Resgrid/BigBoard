import { useEffect, useRef } from 'react';

import { logger } from '@/lib/logging';
import { useCoreStore } from '@/stores/app/core-store';
import { useSignalRStore } from '@/stores/signalr/signalr-store';

export const useStatusSignalRUpdates = () => {
  const lastProcessedTimestamp = useRef<number>(0);
  const { activeUnitId, setActiveUnitWithFetch } = useCoreStore();

  const lastUpdateTimestamp = useSignalRStore((state) => state.lastUpdateTimestamp);
  const lastUpdateMessage = useSignalRStore((state) => state.lastUpdateMessage);

  useEffect(() => {
    const handleStatusUpdate = async () => {
      try {
        if (!activeUnitId) {
          logger.info({
            message: 'No active unit, skipping status update',
          });
          return;
        }

        // Parse the SignalR message to check if it's a unit status update
        if (lastUpdateMessage && typeof lastUpdateMessage === 'string') {
          try {
            const parsedMessage = JSON.parse(lastUpdateMessage);

            // Check if this is a unit status update message
            if (parsedMessage && parsedMessage.UnitId === activeUnitId) {
              logger.info({
                message: 'Processing unit status update for active unit',
                context: {
                  unitId: activeUnitId,
                  timestamp: lastUpdateTimestamp,
                  message: parsedMessage,
                },
              });

              // Refresh the active unit status
              await setActiveUnitWithFetch(activeUnitId);

              // Update the last processed timestamp
              lastProcessedTimestamp.current = lastUpdateTimestamp;
            }
          } catch (parseError) {
            logger.error({
              message: 'Failed to parse SignalR message',
              context: { error: parseError, message: lastUpdateMessage },
            });
          }
        }
      } catch (error) {
        logger.error({
          message: 'Failed to process unit status update',
          context: { error },
        });
      }
    };

    if (lastUpdateTimestamp > 0 && lastUpdateTimestamp !== lastProcessedTimestamp.current && activeUnitId) {
      handleStatusUpdate();
    }
  }, [lastUpdateTimestamp, lastUpdateMessage, activeUnitId, setActiveUnitWithFetch]);
};
