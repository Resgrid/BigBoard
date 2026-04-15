import { create } from 'zustand';

import { getCallPriorities } from '@/api/calls/callPriorities';
import { getScheduledCallExtraData, getScheduledCalls } from '@/api/scheduledCalls/scheduledCalls';
import { logger } from '@/lib/logging';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallExtraDataResultData } from '@/models/v4/calls/callExtraDataResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';

interface ScheduledCallsState {
  scheduledCalls: CallResultData[];
  callPriorities: CallPriorityResultData[];
  callExtraDataMap: Record<string, CallExtraDataResultData>;
  lastCallExtraDataFetchId: number;
  isLoading: boolean;
  error: string | null;
  fetchScheduledCalls: () => Promise<void>;
  init: () => Promise<void>;
}

export const useScheduledCallsStore = create<ScheduledCallsState>((set, get) => ({
  scheduledCalls: [],
  callPriorities: [],
  callExtraDataMap: {},
  lastCallExtraDataFetchId: 0,
  isLoading: false,
  error: null,
  init: async () => {
    set({ isLoading: true, error: null });

    try {
      const [scheduledResponse, prioritiesResponse] = await Promise.all([getScheduledCalls(), getCallPriorities()]);
      set({
        scheduledCalls: scheduledResponse.Data || [],
        callPriorities: prioritiesResponse.Data || [],
        isLoading: false,
      });

      // Fetch extra data for all scheduled calls in parallel
      const calls = scheduledResponse.Data || [];
      const fetchId = Date.now();
      set({ lastCallExtraDataFetchId: fetchId });
      if (calls.length > 0) {
        const extraDataResults = await Promise.allSettled(calls.map((call) => getScheduledCallExtraData(call.CallId)));
        if (get().lastCallExtraDataFetchId !== fetchId) return;
        const newExtraDataMap: Record<string, CallExtraDataResultData> = {};
        extraDataResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.Data) {
            newExtraDataMap[calls[index].CallId] = result.value.Data;
          }
        });
        set({ callExtraDataMap: newExtraDataMap });
      } else {
        if (get().lastCallExtraDataFetchId === fetchId) {
          set({ callExtraDataMap: {} });
        }
      }
    } catch (error) {
      logger.error({
        message: 'Failed to initialize scheduled calls store',
        context: { error },
      });
      set({ error: 'Failed to load scheduled calls', isLoading: false });
    }
  },
  fetchScheduledCalls: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getScheduledCalls();
      set({ scheduledCalls: response.Data || [], isLoading: false });

      const calls = response.Data || [];
      const fetchId = Date.now();
      set({ lastCallExtraDataFetchId: fetchId });
      if (calls.length > 0) {
        const extraDataResults = await Promise.allSettled(calls.map((call) => getScheduledCallExtraData(call.CallId)));
        if (get().lastCallExtraDataFetchId !== fetchId) return;
        const newExtraDataMap: Record<string, CallExtraDataResultData> = {};
        extraDataResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.Data) {
            newExtraDataMap[calls[index].CallId] = result.value.Data;
          }
        });
        set({ callExtraDataMap: newExtraDataMap });
      } else {
        if (get().lastCallExtraDataFetchId === fetchId) {
          set({ callExtraDataMap: {} });
        }
      }
    } catch {
      set({ error: 'Failed to fetch scheduled calls', isLoading: false });
    }
  },
}));
