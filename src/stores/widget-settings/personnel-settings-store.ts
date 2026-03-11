import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PersonnelColumnKey = 'name' | 'group' | 'staffing' | 'status' | 'roles' | 'timestamp';

export const PERSONNEL_COLUMN_LABELS: Record<PersonnelColumnKey, string> = {
  name: 'Name',
  group: 'Group',
  staffing: 'Staffing',
  status: 'Status',
  roles: 'Roles',
  timestamp: 'Timestamp',
};

export const DEFAULT_PERSONNEL_COLUMN_ORDER: PersonnelColumnKey[] = ['name', 'group', 'staffing', 'status', 'roles', 'timestamp'];

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
  sortOrders: { groupId: string; weight: number }[];
  hideGroups: string[];
  columnOrder: PersonnelColumnKey[];
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
  columnOrder: DEFAULT_PERSONNEL_COLUMN_ORDER,
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
