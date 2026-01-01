import { type DepartmentRightsResult } from '@/models/v4/security/departmentRightsResult';

import { createApiEndpoint } from '../common/client';

const getCurrentUsersRightsApi = createApiEndpoint('/Security/GetCurrentUsersRights');

export const getCurrentUsersRights = async () => {
  const response = await getCurrentUsersRightsApi.get<DepartmentRightsResult>();
  return response.data;
};
