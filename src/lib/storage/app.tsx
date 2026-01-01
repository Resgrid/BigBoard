import { Env } from '@env';

import { getItem, removeItem, setItem } from '@/lib/storage';

const BASE_URL = 'baseUrl';
const ACTIVE_UNIT_ID = 'activeUnitId';
const ACTIVE_CALL_ID = 'activeCallId';
const DEVICE_UUID = 'unitDeviceUuid';

export const removeBaseApiUrl = () => removeItem(BASE_URL);
export const setBaseApiUrl = (value: string) => setItem<string>(BASE_URL, value);

export const getBaseApiUrl = () => {
  const baseUrl = getItem<string>(BASE_URL);
  if (!baseUrl) {
    return `${Env.BASE_API_URL}/api/${Env.API_VERSION}`;
  }
  return baseUrl;
};

export const removeDeviceUuid = () => removeItem(DEVICE_UUID);
export const setDeviceUuid = (value: string) => setItem<string>(DEVICE_UUID, value);

export const getDeviceUuid = () => {
  const uuid = getItem<string>(DEVICE_UUID);
  return uuid;
};
