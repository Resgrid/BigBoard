import { type GetConfigResult } from '@/models/v4/configs/getConfigResult';
import { type GetSystemConfigResult } from '@/models/v4/configs/getSystemConfigResult';

import { createApiEndpoint } from '../common';

// BigBoard loads config after sign-in and needs the department's timer settings.
// The public bootstrap endpoint can succeed anonymously with an empty timer list;
// the authenticated endpoint allows the API client to refresh an expired token.
const getConfigApi = createApiEndpoint('/Config/GetDepartmentConfig');
const getSystemConfigApi = createApiEndpoint('/Config/GetSystemConfig');

export const getConfig = async (key: string) => {
  const response = await getConfigApi.get<GetConfigResult>({
    key: key,
  });
  return response.data;
};

export const getSystemConfig = async (signal?: AbortSignal) => {
  const response = await getSystemConfigApi.get<GetSystemConfigResult>(undefined, signal);
  return response.data;
};
