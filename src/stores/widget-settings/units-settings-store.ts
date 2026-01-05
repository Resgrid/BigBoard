import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UnitsWidgetSettings {
  showStation: boolean;
  showType: boolean;
  showState: boolean;
  showTimestamp: boolean;
  showEta: boolean;
  fontSize: number;
  sortOrders: { groupId: string; weight: number }[];
  hideGroups: string[];
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
