import { createApiEndpoint } from '@/api/common/client';
import { type GetSetUnitStateResult } from '@/models/v4/dispatch/getSetUnitStateResult';

const getSetUnitStateApi = createApiEndpoint('/Dispatch/GetSetUnitState');

export const getSetUnitState = async (unitId: string) => {
  const response = await getSetUnitStateApi.get<GetSetUnitStateResult>({
    unitId: unitId,
  });
  return response.data;
};
