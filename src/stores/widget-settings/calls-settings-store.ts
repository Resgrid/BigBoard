import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CallsColumnKey = 'id' | 'name' | 'address' | 'timestamp' | 'priority' | 'dispatched';

export const CALLS_COLUMN_LABELS: Record<CallsColumnKey, string> = {
  id: 'ID',
  name: 'Name',
  address: 'Address',
  timestamp: 'Timestamp',
  priority: 'Priority',
  dispatched: 'Dispatched',
};

export const DEFAULT_CALLS_COLUMN_ORDER: CallsColumnKey[] = ['id', 'name', 'address', 'timestamp', 'priority', 'dispatched'];

export interface CallsWidgetSettings {
  showId: boolean;
  showName: boolean;
  showTimestamp: boolean;
  showUser: boolean;
  showPriority: boolean;
  showAddress: boolean;
  showLinkedCalls: boolean;
  showDispatched: boolean;
  dispatchScrollSpeed: number;
  fontSize: number;
  columnOrder: CallsColumnKey[];
}

interface CallsSettingsState {
  settings: CallsWidgetSettings;
  updateSettings: (updates: Partial<CallsWidgetSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: CallsWidgetSettings = {
  showId: true,
  showName: true,
  showTimestamp: true,
  showUser: true,
  showPriority: true,
  showAddress: true,
  showLinkedCalls: true,
  showDispatched: true,
  dispatchScrollSpeed: 40,
  fontSize: 12,
  columnOrder: DEFAULT_CALLS_COLUMN_ORDER,
};

export const useCallsSettingsStore = create<CallsSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      resetSettings: () =>
        set({
          settings: defaultSettings,
        }),
    }),
    {
      name: 'calls-widget-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
