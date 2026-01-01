import { type GetConfigResult } from '@/models/v4/configs/getConfigResult';
import { type GetSystemConfigResult } from '@/models/v4/configs/getSystemConfigResult';

import { createApiEndpoint } from '../common';

const getConfigApi = createApiEndpoint('/Config/GetConfig');
const getSystemConfigApi = createApiEndpoint('/Config/GetSystemConfig');

export const getConfig = async (key: string) => {
  const response = await getConfigApi.get<GetConfigResult>({
    key: key,
  });
  return response.data;
};

export const getSystemConfig = async () => {
  const response = await getSystemConfigApi.get<GetSystemConfigResult>();
  return response.data;
};
