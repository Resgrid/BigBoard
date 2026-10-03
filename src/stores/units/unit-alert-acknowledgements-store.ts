import { isAxiosError } from 'axios';
import { create } from 'zustand';

import { acknowledgeUnitStatusAlert, type AcknowledgeUnitStatusAlertRequest, clearUnitStatusAlertAcknowledgement, getActiveUnitStatusAlertAcknowledgements } from '@/api/units/unitStatusAlerts';
import { logger } from '@/lib/logging';
import { singleFlight } from '@/lib/single-flight';
import { type SaveUnitStatusAlertAcknowledgementResult, type UnitStatusAlertAcknowledgementError } from '@/models/v4/unitStatusAlerts/saveUnitStatusAlertAcknowledgementResult';
import { type UnitStatusAlertAcknowledgementResultData } from '@/models/v4/unitStatusAlerts/unitStatusAlertAcknowledgementResultData';

import { useUnitsStore } from './store';

export type UnitAlertAcknowledgementOutcome = { ok: true } | { ok: false; error: UnitStatusAlertAcknowledgementError | 'unknown' };

interface UnitAlertAcknowledgementsState {
  /** The acknowledgement covering each unit's current status, keyed by UnitId. */
  acknowledgements: Record<string, UnitStatusAlertAcknowledgementResultData>;
  isLoading: boolean;
  error: string | null;
  fetchAcknowledgements: () => Promise<void>;
  acknowledge: (request: AcknowledgeUnitStatusAlertRequest) => Promise<UnitAlertAcknowledgementOutcome>;
  clear: (acknowledgement: UnitStatusAlertAcknowledgementResultData) => Promise<UnitAlertAcknowledgementOutcome>;
}

const byUnit = (rows: UnitStatusAlertAcknowledgementResultData[]): Record<string, UnitStatusAlertAcknowledgementResultData> =>
  rows.reduce<Record<string, UnitStatusAlertAcknowledgementResultData>>((map, row) => {
    map[row.UnitId] = row;
    return map;
  }, {});

/** The server answers a refusal with a 4xx carrying the same body shape as a success. */
const refusalOf = (error: unknown): SaveUnitStatusAlertAcknowledgementResult | null => {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'Error' in error.response.data) {
    return error.response.data as SaveUnitStatusAlertAcknowledgementResult;
  }

  return null;
};

export const useUnitAlertAcknowledgementsStore = create<UnitAlertAcknowledgementsState>((set, get) => {
  const upsert = (row: UnitStatusAlertAcknowledgementResultData) => set({ acknowledgements: { ...get().acknowledgements, [row.UnitId]: row } });

  const remove = (unitId: string) => {
    const { [unitId]: _, ...rest } = get().acknowledgements;
    set({ acknowledgements: rest });
  };

  const handleRefusal = (error: unknown, unitId: string): UnitAlertAcknowledgementOutcome => {
    const refusal = refusalOf(error);

    if (!refusal?.Error) {
      logger.error({ message: 'Failed to save unit status alert acknowledgement', context: { error } });
      return { ok: false, error: 'unknown' };
    }

    if (refusal.Error === 'unit_alert_conflict' && refusal.Data) {
      // A colleague got there first. Show theirs.
      upsert(refusal.Data);
    } else if (refusal.Error === 'unit_alert_status_changed' || refusal.Error === 'unit_alert_not_overdue') {
      // The board is behind the unit. Catch up so the row disappears or moves.
      remove(unitId);
      useUnitsStore.getState().fetchUnits();
    }

    return { ok: false, error: refusal.Error };
  };

  return {
    acknowledgements: {},
    isLoading: false,
    error: null,
    fetchAcknowledgements: singleFlight(async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await getActiveUnitStatusAlertAcknowledgements();
        set({ acknowledgements: byUnit(response.Data ?? []), isLoading: false });
      } catch (error) {
        // Keep whatever was showing. An acknowledgement disappearing would bring an alert back that someone has handled.
        logger.error({ message: 'Failed to fetch unit status alert acknowledgements', context: { error } });
        set({ error: 'Failed to fetch unit status alert acknowledgements', isLoading: false });
      }
    }),
    acknowledge: async (request) => {
      try {
        const response = await acknowledgeUnitStatusAlert(request);

        if (response.Data) {
          upsert(response.Data);
        }

        return { ok: true };
      } catch (error) {
        return handleRefusal(error, request.unitId);
      }
    },
    clear: async (acknowledgement) => {
      try {
        await clearUnitStatusAlertAcknowledgement(acknowledgement.UnitStatusAlertAcknowledgementId);
        remove(acknowledgement.UnitId);
        return { ok: true };
      } catch (error) {
        const refusal = refusalOf(error);

        // Already gone (cleared elsewhere, or the unit was removed) is the state that was asked for.
        if (refusal?.Error === 'unit_alert_not_found') {
          remove(acknowledgement.UnitId);
          return { ok: true };
        }

        return handleRefusal(error, acknowledgement.UnitId);
      }
    },
  };
});
