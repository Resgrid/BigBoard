import { createApiEndpoint } from '@/api/common/client';
import { type StatusesResult } from '@/models/v4/statuses/statusesResult';
import { type UnitTypeStatusesResult } from '@/models/v4/statuses/unitTypeStatusesResult';

const getAllPersonnelStatusesApi = createApiEndpoint('/Statuses/GetAllStatusesForPersonnel');

const getAllPersonnelStaffingsApi = createApiEndpoint('/Statuses/GetAllStaffingsForPersonnel');

const getAllUnitStatusesApi = createApiEndpoint('/Statuses/GetAllUnitStatuses');

export const getAllPersonnelStatuses = async () => {
  const response = await getAllPersonnelStatusesApi.get<StatusesResult>();
  return response.data;
};

export const getAllPersonnelStaffings = async () => {
  const response = await getAllPersonnelStaffingsApi.get<StatusesResult>();
  return response.data;
};

export const getAllUnitStatuses = async () => {
  const response = await getAllUnitStatusesApi.get<UnitTypeStatusesResult>();
  return response.data;
};
