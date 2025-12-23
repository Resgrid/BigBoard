import { create } from 'zustand';

import { getAllUnitStatuses } from '@/api/satuses';
import { getUnitsInfos } from '@/api/units/units';
import { type UnitTypeStatusResultData } from '@/models/v4/statuses/unitTypeStatusResultData';
import { type UnitInfoResultData } from '@/models/v4/units/unitInfoResultData';

interface UnitsState {
  units: UnitInfoResultData[];
  unitStatuses: UnitTypeStatusResultData[];
  isLoading: boolean;
  error: string | null;
  fetchUnits: () => Promise<void>;
}

export const useUnitsStore = create<UnitsState>((set) => ({
  units: [],
  unitStatuses: [],
  isLoading: false,
  error: null,
  fetchUnits: async () => {
    set({ isLoading: true, error: null });
    try {
      const unitsResponse = await getUnitsInfos('');
      const unitStatusesResponse = await getAllUnitStatuses();
      set({ units: unitsResponse.Data, unitStatuses: unitStatusesResponse.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch units', isLoading: false });
    }
  },
}));
