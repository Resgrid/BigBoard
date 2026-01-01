export const PERMISSIONS = {
  ANDROID: {
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    CAMERA: 'android.permission.CAMERA',
  },
  IOS: {
    MICROPHONE: 'ios.permission.MICROPHONE',
    CAMERA: 'ios.permission.CAMERA',
  },
};

export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};

export const check = jest.fn().mockResolvedValue(RESULTS.GRANTED);
export const request = jest.fn().mockResolvedValue(RESULTS.GRANTED);
export const requestMultiple = jest.fn().mockResolvedValue({});
export const openSettings = jest.fn().mockResolvedValue(undefined);
export const checkNotifications = jest.fn().mockResolvedValue({
  status: RESULTS.GRANTED,
  settings: {},
});
export const requestNotifications = jest.fn().mockResolvedValue({
  status: RESULTS.GRANTED,
  settings: {},
});
