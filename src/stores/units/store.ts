import { create } from 'zustand';

import { getAllUnitStatuses } from '@/api/satuses';
import { getUnitsInfos } from '@/api/units/units';
import { singleFlight } from '@/lib/single-flight';
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
  fetchUnits: singleFlight(async () => {
    set({ isLoading: true, error: null });
    try {
      // Always from the server. This runs on mount and after every unitStatusUpdated push; reading the
      // cached copy here left a unit that had already departed shown as Dispatched, and counting up
      // past its status timer, for as long as the cache lived.
      const unitsResponse = await getUnitsInfos('', true);
      const unitStatusesResponse = await getAllUnitStatuses();
      set({ units: unitsResponse.Data ?? [], unitStatuses: unitStatusesResponse.Data ?? [], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch units', isLoading: false });
    }
  }),
}));
