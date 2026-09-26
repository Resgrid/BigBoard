import { Env } from '@env';

import { getItem, removeItem, setItem } from '@/lib/storage';

const BASE_URL = 'baseUrl';
const ACTIVE_UNIT_ID = 'activeUnitId';
const ACTIVE_CALL_ID = 'activeCallId';
const DEVICE_UUID = 'unitDeviceUuid';

export const BASE_API_URL_STORAGE_KEY = BASE_URL;

const normalizeStoredApiUrl = (value: string) => value.trim().replace(/\/+$/, '');

// The desktop build serves the web export from a loopback port picked at launch, so its origin -- and
// the localStorage behind it -- is new on every start. The Electron shell keeps the server URL in its own
// settings file so the chosen server survives restarts. Undefined on native and in a plain browser,
// where MMKV / localStorage already persist it.
const getDesktopSettings = () => (typeof window !== 'undefined' ? window.electronAPI : undefined);

export const removeBaseApiUrl = () => {
  getDesktopSettings()?.setSetting(BASE_URL, null);
  return removeItem(BASE_URL);
};

export const setBaseApiUrl = (value: string) => {
  const normalized = normalizeStoredApiUrl(value);
  getDesktopSettings()?.setSetting(BASE_URL, normalized);
  return setItem<string>(BASE_URL, normalized);
};

export const getBaseApiUrl = () => {
  const baseUrl = getDesktopSettings()?.getSetting(BASE_URL) || getItem<string>(BASE_URL);
  if (!baseUrl) {
    return normalizeStoredApiUrl(`${Env.BASE_API_URL}/api/${Env.API_VERSION}`);
  }
  return normalizeStoredApiUrl(baseUrl);
};

export const removeDeviceUuid = () => removeItem(DEVICE_UUID);
export const setDeviceUuid = (value: string) => setItem<string>(DEVICE_UUID, value);

export const getDeviceUuid = () => {
  const uuid = getItem<string>(DEVICE_UUID);
  return uuid;
};
