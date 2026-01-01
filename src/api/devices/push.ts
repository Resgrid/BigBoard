import { type PushRegistrationResult } from '@/models/v4/device/pushRegistrationResult';
import { type PushRegistrationUnitInput } from '@/models/v4/device/pushRegistrationUnitInput';

import { createApiEndpoint } from '../common/client';

const registerUnitDeviceApi = createApiEndpoint('/Devices/RegisterUnitDevice');

export const registerUnitDevice = async (data: PushRegistrationUnitInput) => {
  const response = await registerUnitDeviceApi.post<PushRegistrationResult>({
    ...data,
  });
  return response.data;
};
