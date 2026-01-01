export const AndroidImportance = {
  DEFAULT: 'default',
  HIGH: 'high',
  LOW: 'low',
  MIN: 'min',
  NONE: 'none',
  UNSPECIFIED: 'unspecified',
};

const notifee = {
  createChannel: jest.fn().mockResolvedValue('mock-channel-id'),
  displayNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  getPermissionSettings: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
  setBadgeCount: jest.fn().mockResolvedValue(undefined),
  decrementBadgeCount: jest.fn().mockResolvedValue(undefined),
  incrementBadgeCount: jest.fn().mockResolvedValue(undefined),
  getBadgeCount: jest.fn().mockResolvedValue(0),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  onForegroundEvent: jest.fn(),
  onBackgroundEvent: jest.fn(),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  getDisplayedNotifications: jest.fn().mockResolvedValue([]),
  getTriggerNotifications: jest.fn().mockResolvedValue([]),
  openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
  openNotificationSettings: jest.fn().mockResolvedValue(undefined),
  openPowerManagerSettings: jest.fn().mockResolvedValue(undefined),
  getPowerManagerInfo: jest.fn().mockResolvedValue({}),
  isBatteryOptimizationEnabled: jest.fn().mockResolvedValue(false),
  registerForegroundService: jest.fn().mockResolvedValue(undefined),
  stopForegroundService: jest.fn().mockResolvedValue(undefined),
};

export default notifee;
