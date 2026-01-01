import { createApiEndpoint } from '@/api/common/client';
import { type SaveUnitLocationInput } from '@/models/v4/unitLocation/saveUnitLocationInput';
import { type SaveUnitLocationResult } from '@/models/v4/unitLocation/saveUnitLocationResult';
import { type UnitLocationResult } from '@/models/v4/unitLocation/unitLocationResult';

const setUnitLocationApi = createApiEndpoint('/UnitLocation/SetUnitLocation');
const getUnitLocationApi = createApiEndpoint('/UnitLocation/GetLatestUnitLocation');

export const setUnitLocation = async (data: SaveUnitLocationInput) => {
  const response = await setUnitLocationApi.post<SaveUnitLocationResult>({
    ...data,
  });
  return response.data;
};

export const getUnitLocation = async (unitId: string) => {
  const response = await getUnitLocationApi.get<UnitLocationResult>({
    unitId: unitId,
  });
  return response.data;
};
