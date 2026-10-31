import { create } from 'zustand';

import { logger } from '@/lib/logging';
import { audioService } from '@/services/audio.service';

export interface PushNotificationData {
  eventCode: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export type NotificationType = 'call' | 'message' | 'chat' | 'group-chat' | 'unknown';

export interface ParsedNotification {
  type: NotificationType;
  id: string;
  eventCode: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface PushNotificationModalState {
  isOpen: boolean;
  notification: ParsedNotification | null;
  showNotificationModal: (notificationData: PushNotificationData) => void;
  hideNotificationModal: () => void;
  parseNotification: (notificationData: PushNotificationData) => ParsedNotification;
}

/**
 * Ids parsed out of a push event code are attacker-influenced and land straight in a route
 * path, so anything that could steer the router elsewhere — a path separator, a query, a
 * fragment — disqualifies the id. Same rule as the sibling apps' deep-link handlers and
 * notification modals.
 */
export const isSafeRouteId = (id: string): boolean => id.length > 0 && !/[/\\?#]/.test(id);

export const usePushNotificationModalStore = create<PushNotificationModalState>((set, get) => ({
  isOpen: false,
  notification: null,

  parseNotification: (notificationData: PushNotificationData): ParsedNotification => {
    const eventCode = notificationData.eventCode || '';
    let type: NotificationType = 'unknown';
    let id = '';

    // Parse event code format like "C:1234", "M:5678", "T:9012", "G:3456"
    if (eventCode && eventCode.includes(':')) {
      const [prefix, notificationId] = eventCode.split(':');
      const lowerPrefix = prefix.toLowerCase();

      if (lowerPrefix.startsWith('c')) {
        type = 'call';
      } else if (lowerPrefix.startsWith('m')) {
        type = 'message';
      } else if (lowerPrefix.startsWith('t')) {
        type = 'chat';
      } else if (lowerPrefix.startsWith('g')) {
        type = 'group-chat';
      }

      id = notificationId || '';
    }

    return {
      type,
      id,
      eventCode,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
    };
  },

  showNotificationModal: (notificationData: PushNotificationData) => {
    const parsedNotification = get().parseNotification(notificationData);

    logger.info({
      message: 'Showing push notification modal',
      context: {
        type: parsedNotification.type,
        id: parsedNotification.id,
        eventCode: parsedNotification.eventCode,
      },
    });

    // Play notification sound
    audioService.playNotificationSound(parsedNotification.type).catch((error) => {
      logger.error({
        message: 'Failed to play notification sound',
        context: { error, type: parsedNotification.type },
      });
    });

    set({
      isOpen: true,
      notification: parsedNotification,
    });
  },

  hideNotificationModal: () => {
    logger.info({
      message: 'Hiding push notification modal',
    });

    set({
      isOpen: false,
      notification: null,
    });
  },
}));
