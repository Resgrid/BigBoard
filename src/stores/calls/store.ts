import { Platform } from 'react-native';
import { create } from 'zustand';

import { getCallPriorities } from '@/api/calls/callPriorities';
import { getCalls } from '@/api/calls/calls';
import { getCallTypes } from '@/api/calls/callTypes';
import { logger } from '@/lib/logging';
import { type CallPriorityResultData } from '@/models/v4/callPriorities/callPriorityResultData';
import { type CallResultData } from '@/models/v4/calls/callResultData';
import { type CallTypeResultData } from '@/models/v4/callTypes/callTypeResultData';

interface CallsState {
  calls: CallResultData[];
  callPriorities: CallPriorityResultData[];
  callTypes: CallTypeResultData[];
  isLoading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
  fetchCallPriorities: () => Promise<void>;
  fetchCallTypes: () => Promise<void>;
  init: () => Promise<void>;
}

export const useCallsStore = create<CallsState>((set, get) => ({
  calls: [],
  callPriorities: [],
  callTypes: [],
  isLoading: false,
  error: null,
  init: async () => {
    set({ isLoading: true, error: null });

    try {
      const callsResponse = await getCalls();
      const callPrioritiesResponse = await getCallPriorities();
      const callTypesResponse = await getCallTypes();
      set({
        calls: callsResponse.Data,
        callPriorities: callPrioritiesResponse.Data,
        callTypes: callTypesResponse.Data,
        isLoading: false,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to initialize calls store',
        context: { error },
      });
      set({ error: 'Failed to initialize calls store', isLoading: false });
      // Don't re-throw on error, allow initialization to continue
    }
  },
  fetchCalls: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCalls();
      set({ calls: response.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch calls', isLoading: false });
    }
  },
  fetchCallPriorities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCallPriorities();
      set({ callPriorities: response.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch call priorities', isLoading: false });
    }
  },
  fetchCallTypes: async () => {
    // Only fetch if we don't have call types in the store
    const { callTypes } = get();
    if (callTypes.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await getCallTypes();
      set({ callTypes: response.Data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch call types', isLoading: false });
    }
  },
}));
