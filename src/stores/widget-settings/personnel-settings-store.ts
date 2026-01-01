import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonnelWidgetSettings {
  showGroup: boolean;
  showStaffing: boolean;
  showStatus: boolean;
  showRoles: boolean;
  showTimestamp: boolean;
  showEta: boolean;
  sortRespondingToTop: boolean;
  respondingText: string;
  hideUnavailable: boolean;
  hideNotResponding: boolean;
  notRespondingText: string;
  unavailableText: string;
  fontSize: number;
  sortOrders: Array<{ groupId: string; weight: number }>;
  hideGroups: string[];
}

interface PersonnelSettingsState {
  settings: PersonnelWidgetSettings;
  updateSettings: (updates: Partial<PersonnelWidgetSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: PersonnelWidgetSettings = {
  showGroup: true,
  showStaffing: true,
  showStatus: true,
  showRoles: true,
  showTimestamp: true,
  showEta: true,
  sortRespondingToTop: false,
  respondingText: 'Responding',
  hideUnavailable: false,
  hideNotResponding: false,
  notRespondingText: 'Not Responding',
  unavailableText: 'Unavailable',
  fontSize: 12,
  sortOrders: [],
  hideGroups: [],
};

export const usePersonnelSettingsStore = create<PersonnelSettingsState>()(
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
      name: 'personnel-widget-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
