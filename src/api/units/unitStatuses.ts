import { createApiEndpoint } from '@/api/common/client';
import { type UnitTypeStatusesResult } from '@/models/v4/statuses/unitTypeStatusesResult';
import { type SaveUnitStatusInput } from '@/models/v4/unitStatus/saveUnitStatusInput';
import { type UnitStatusesResult } from '@/models/v4/unitStatus/unitStatusesResult';
import { type UnitStatusResult } from '@/models/v4/unitStatus/unitStatusResult';

const getAllUnitStatusesApi = createApiEndpoint('/UnitStatus/GetAllUnitStatuses');
const getUnitStatusApi = createApiEndpoint('/UnitStatus/GetUnitStatus');
const saveUnitStatusApi = createApiEndpoint('/UnitStatus/SaveUnitStatus');

export const getAllUnitStatuses = async () => {
  const response = await getAllUnitStatusesApi.get<UnitStatusesResult>();
  return response.data;
};

export const getUnitStatus = async (unitId: string) => {
  const response = await getUnitStatusApi.get<UnitStatusResult>({
    unitId: unitId,
  });
  return response.data;
};

export const saveUnitStatus = async (data: SaveUnitStatusInput) => {
  if (!data.RespondingTo) {
    data.RespondingTo = '0';
  }

  const response = await saveUnitStatusApi.post<UnitTypeStatusesResult>({
    ...data,
  });
  return response.data;
};
