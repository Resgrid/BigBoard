import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CallsWidgetSettings {
  showId: boolean;
  showName: boolean;
  showTimestamp: boolean;
  showUser: boolean;
  showPriority: boolean;
  showAddress: boolean;
  showLinkedCalls: boolean;
  fontSize: number;
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
  fontSize: 12,
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
