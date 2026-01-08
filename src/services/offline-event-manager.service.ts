import { logger } from '@/lib/logging';

/**
 * Offline Event Manager Service
 * Handles queueing and syncing of events when offline
 */
class OfflineEventManagerService {
  public async queueUnitStatusEvent(event: any): Promise<void> {
    logger.info({ message: 'Queueing unit status event', context: { event } });
  }

  public async syncQueuedEvents(): Promise<void> {
    logger.info({ message: 'Syncing queued events' });
  }

  public async clearQueue(): Promise<void> {
    logger.info({ message: 'Clearing event queue' });
  }
}

export const offlineEventManager = new OfflineEventManagerService();
