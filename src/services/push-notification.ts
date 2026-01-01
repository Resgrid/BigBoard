import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { registerUnitDevice } from '@/api/devices/push';
import { logger } from '@/lib/logging';
import { getDeviceUuid } from '@/lib/storage/app';
import { useCoreStore } from '@/stores/app/core-store';
import { usePushNotificationModalStore } from '@/stores/push-notification/store';
import { securityStore } from '@/stores/security/store';

// Define notification response types
export interface PushNotificationData {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;
  private notificationListener: { remove: () => void } | null = null;
  private responseListener: { remove: () => void } | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private async createNotificationChannel(id: string, name: string, description: string, sound?: string, vibration: boolean = true): Promise<void> {
    await Notifications.setNotificationChannelAsync(id, {
      name,
      description,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: vibration ? [0, 250, 250, 250] : undefined,
      sound,
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  private async setupAndroidNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Standard call channels
        await this.createNotificationChannel('calls', 'Generic Call', 'Generic Call');
        await this.createNotificationChannel('0', 'Emergency Call', 'Emergency Call', 'callemergency');
        await this.createNotificationChannel('1', 'High Call', 'High Call', 'callhigh');
        await this.createNotificationChannel('2', 'Medium Call', 'Medium Call', 'callmedium');
        await this.createNotificationChannel('3', 'Low Call', 'Low Call', 'calllow');

        // Message and notification channels
        await this.createNotificationChannel('notif', 'Notification', 'Notifications', undefined, false);
        await this.createNotificationChannel('message', 'Message', 'Messages', undefined, false);

        // Custom call channels (c1-c25)
        for (let i = 1; i <= 25; i++) {
          const channelId = `c${i}`;
          await this.createNotificationChannel(channelId, `Custom Call ${i}`, `Custom Call Tone ${i}`, channelId);
        }

        logger.info({
          message: 'Android notification channels setup completed',
        });
      } catch (error) {
        logger.error({
          message: 'Error setting up Android notification channels',
          context: { error },
        });
      }
    }
  }

  private async initialize(): Promise<void> {
    // Set up Android notification channels
    await this.setupAndroidNotificationChannels();

    // Set up notification listeners
    this.notificationListener = Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
    this.responseListener = Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

    logger.info({
      message: 'Push notification service initialized',
    });
  }

  private handleNotificationReceived = (notification: Notifications.Notification): void => {
    const data = notification.request.content.data;

    logger.info({
      message: 'Notification received',
      context: {
        data,
      },
    });

    // Check if the notification has an eventCode and show modal
    // eventCode must be a string to be valid
    if (data && data.eventCode && typeof data.eventCode === 'string') {
      const notificationData = {
        eventCode: data.eventCode as string,
        title: notification.request.content.title || undefined,
        body: notification.request.content.body || undefined,
        data,
      };

      // Show the notification modal using the store
      usePushNotificationModalStore.getState().showNotificationModal(notificationData);
    }
  };

  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
    const data = response.notification.request.content.data;

    logger.info({
      message: 'Notification response received',
      context: {
        data,
      },
    });

    // Here you can handle navigation or other actions based on notification data
    // For example, if the notification contains a callId, you could navigate to that call
    // This would typically involve using a navigation service or dispatching an action
  };

  public async registerForPushNotifications(unitId: string, departmentCode: string): Promise<string | null> {
    if (!Device.isDevice) {
      logger.warn({
        message: 'Push notifications are not available on simulator/emulator',
      });
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn({
          message: 'Failed to get push notification permissions',
          context: { status: finalStatus },
        });
        return null;
      }

      // Get the token using the non-Expo push notification service method
      const devicePushToken = await Notifications.getDevicePushTokenAsync();

      // The token format depends on the platform
      const token = Platform.OS === 'ios' ? devicePushToken.data : devicePushToken.data;

      this.pushToken = token as string;

      logger.info({
        message: 'Push notification token obtained',
        context: {
          token: this.pushToken,
          unitId,
          platform: Platform.OS,
        },
      });

      await registerUnitDevice({
        UnitId: unitId,
        Token: this.pushToken,
        Platform: Platform.OS === 'ios' ? 1 : 2,
        DeviceUuid: getDeviceUuid() || '',
        Prefix: departmentCode,
      });

      return this.pushToken;
    } catch (error) {
      logger.error({
        message: 'Error registering for push notifications',
        context: { error },
      });
      return null;
    }
  }

  // Method to send the token to your backend
  private async sendTokenToBackend(token: string, unitId: string): Promise<void> {
    // Implement your API call to register the token with your backend
    // This is where you would associate the token with the unitId
    try {
      // Example implementation:
      // await api.post('/register-push-token', { token, unitId });

      logger.info({
        message: 'Push token registered with backend',
        context: { token, unitId },
      });
    } catch (error) {
      logger.error({
        message: 'Failed to register push token with backend',
        context: { error, token, unitId },
      });
    }
  }

  public getPushToken(): string | null {
    return this.pushToken;
  }

  public async sendTestNotification(): Promise<void> {
    if (!this.pushToken) {
      logger.warn({
        message: 'Cannot send test notification - no push token available',
      });
      return;
    }

    try {
      // This is a local test notification, not sent through a server
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Resgrid Unit',
          data: { type: 'test', timestamp: new Date().toISOString() },
        },
        trigger: null, // Send immediately
      });

      logger.info({
        message: 'Test notification sent',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to send test notification',
        context: { error },
      });
    }
  }

  public cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

// React hook for component usage
export const usePushNotifications = () => {
  const activeUnitId = useCoreStore((state) => state.activeUnitId);
  const rights = securityStore((state) => state.rights);
  const previousUnitIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only register if we have an active unit ID and it's different from the previous one
    if (rights && activeUnitId && activeUnitId !== previousUnitIdRef.current) {
      pushNotificationService
        .registerForPushNotifications(activeUnitId, rights.DepartmentCode)
        .then((token) => {
          if (token) {
            logger.info({
              message: 'Successfully registered for push notifications',
              context: { unitId: activeUnitId },
            });
          }
        })
        .catch((error) => {
          logger.error({
            message: 'Error in push notification registration hook',
            context: { error },
          });
        });

      previousUnitIdRef.current = activeUnitId;
    }

    // Cleanup function
    return () => {
      // No need to clean up here as the service handles its own cleanup
    };
  }, [activeUnitId, rights]);

  return {
    pushToken: pushNotificationService.getPushToken(),
    sendTestNotification: () => pushNotificationService.sendTestNotification(),
  };
};
