import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UnitsColumnKey = 'name' | 'station' | 'type' | 'state' | 'timestamp';

export const UNITS_COLUMN_LABELS: Record<UnitsColumnKey, string> = {
  name: 'Name',
  station: 'Station',
  type: 'Type',
  state: 'State',
  timestamp: 'Timestamp',
};

export const DEFAULT_UNITS_COLUMN_ORDER: UnitsColumnKey[] = ['name', 'station', 'type', 'state', 'timestamp'];

export interface UnitsWidgetSettings {
  showStation: boolean;
  showType: boolean;
  showState: boolean;
  showTimestamp: boolean;
  showEta: boolean;
  fontSize: number;
  sortOrders: { groupId: string; weight: number }[];
  hideGroups: string[];
  columnOrder: UnitsColumnKey[];
}

interface UnitsSettingsState {
  settings: UnitsWidgetSettings;
  updateSettings: (updates: Partial<UnitsWidgetSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: UnitsWidgetSettings = {
  showStation: true,
  showType: true,
  showState: true,
  showTimestamp: true,
  showEta: false,
  fontSize: 12,
  sortOrders: [],
  hideGroups: [],
  columnOrder: DEFAULT_UNITS_COLUMN_ORDER,
};

export const useUnitsSettingsStore = create<UnitsSettingsState>()(
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
      name: 'units-widget-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
