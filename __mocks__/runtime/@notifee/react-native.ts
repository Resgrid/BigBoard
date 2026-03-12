// Runtime-compatible mock for @notifee/react-native on web/desktop platforms
// This is NOT a Jest mock - it provides functional no-op implementations for runtime use

export const AndroidImportance = {
  DEFAULT: 'default',
  HIGH: 'high',
  LOW: 'low',
  MIN: 'min',
  NONE: 'none',
  UNSPECIFIED: 'unspecified',
} as const;

export const AndroidVisibility = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  SECRET: 'secret',
} as const;

export const EventType = {
  DISMISSED: 'dismissed',
  PRESS: 'press',
  ACTION_PRESS: 'action_press',
  DELIVERED: 'delivered',
} as const;

export const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
} as const;

const notifee = {
  createChannel: async (_channel: unknown): Promise<string> => 'mock-channel-id',
  createChannels: async (_channels: unknown[]): Promise<void> => undefined,
  createChannelGroup: async (_group: unknown): Promise<string> => 'mock-group-id',
  createChannelGroups: async (_groups: unknown[]): Promise<void> => undefined,
  deleteChannel: async (_channelId: string): Promise<void> => undefined,
  deleteChannelGroup: async (_groupId: string): Promise<void> => undefined,
  displayNotification: async (_notification: unknown): Promise<string> => 'mock-notification-id',
  requestPermission: async (): Promise<{ authorizationStatus: number }> => ({ authorizationStatus: 1 }),
  getNotificationSettings: async (): Promise<{ authorizationStatus: number }> => ({ authorizationStatus: 1 }),
  setBadgeCount: async (_count: number): Promise<void> => undefined,
  getBadgeCount: async (): Promise<number> => 0,
  incrementBadgeCount: async (_incrementBy?: number): Promise<void> => undefined,
  decrementBadgeCount: async (_decrementBy?: number): Promise<void> => undefined,
  cancelNotification: async (_id: string): Promise<void> => undefined,
  cancelAllNotifications: async (): Promise<void> => undefined,
  cancelDisplayedNotification: async (_id: string): Promise<void> => undefined,
  cancelDisplayedNotifications: async (): Promise<void> => undefined,
  cancelTriggerNotification: async (_id: string): Promise<void> => undefined,
  cancelTriggerNotifications: async (): Promise<void> => undefined,
  getChannels: async (): Promise<unknown[]> => [],
  getChannel: async (_channelId: string): Promise<unknown | null> => null,
  getChannelGroups: async (): Promise<unknown[]> => [],
  getChannelGroup: async (_groupId: string): Promise<unknown | null> => null,
  getDisplayedNotifications: async (): Promise<unknown[]> => [],
  getTriggerNotifications: async (): Promise<unknown[]> => [],
  getInitialNotification: async (): Promise<unknown | null> => null,
  onForegroundEvent:
    (_observer: (event: unknown) => void): (() => void) =>
    () => {},
  onBackgroundEvent: (_handler: (event: unknown) => Promise<void>): void => {},
  openBatteryOptimizationSettings: async (): Promise<void> => undefined,
  openNotificationSettings: async (_channelId?: string): Promise<void> => undefined,
  openPowerManagerSettings: async (): Promise<void> => undefined,
  getPowerManagerInfo: async (): Promise<unknown> => ({}),
  isBatteryOptimizationEnabled: async (): Promise<boolean> => false,
  registerForegroundService: (_runner: (notification: unknown) => Promise<void>): void => {},
  stopForegroundService: async (): Promise<void> => undefined,
  setNotificationCategories: async (_categories: unknown[]): Promise<void> => undefined,
  getNotificationCategories: async (): Promise<unknown[]> => [],
};

export default notifee;
