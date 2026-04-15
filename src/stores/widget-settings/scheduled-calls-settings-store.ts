import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ScheduledCallsColumnKey = 'name' | 'scheduledTime' | 'priority' | 'address' | 'dispatched';

export const SCHEDULED_CALLS_COLUMN_LABELS: Record<ScheduledCallsColumnKey, string> = {
  name: 'Name',
  scheduledTime: 'Scheduled Time',
  priority: 'Priority',
  address: 'Address',
  dispatched: 'Dispatched',
};

export const DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER: ScheduledCallsColumnKey[] = ['name', 'scheduledTime', 'priority', 'address', 'dispatched'];

export type ScheduledCallsSortBy = 'scheduledTime' | 'priority' | 'name';
export type ScheduledCallsSortOrder = 'asc' | 'desc';

export interface ScheduledCallsWidgetSettings {
  showName: boolean;
  showScheduledTime: boolean;
  showPriority: boolean;
  showAddress: boolean;
  showDispatched: boolean;
  dispatchScrollSpeed: number;
  fontSize: number;
  columnOrder: ScheduledCallsColumnKey[];

  // Sorting
  sortBy: ScheduledCallsSortBy;
  sortOrder: ScheduledCallsSortOrder;

  // Filtering
  filterGroupIds: string[];
  filterUnitIds: string[];
  filterPersonnelIds: string[];
  filterRoleIds: string[];

  // Color coding thresholds (minutes until active)
  colorThresholdRedMinutes: number;
  colorThresholdYellowMinutes: number;
  colorThresholdGreenMinutes: number;
  colorRedHex: string;
  colorYellowHex: string;
  colorGreenHex: string;
  colorDefaultHex: string;
}

interface ScheduledCallsSettingsState {
  settings: ScheduledCallsWidgetSettings;
  updateSettings: (updates: Partial<ScheduledCallsWidgetSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ScheduledCallsWidgetSettings = {
  showName: true,
  showScheduledTime: true,
  showPriority: true,
  showAddress: true,
  showDispatched: true,
  dispatchScrollSpeed: 40,
  fontSize: 12,
  columnOrder: DEFAULT_SCHEDULED_CALLS_COLUMN_ORDER,

  sortBy: 'scheduledTime',
  sortOrder: 'asc',

  filterGroupIds: [],
  filterUnitIds: [],
  filterPersonnelIds: [],
  filterRoleIds: [],

  colorThresholdRedMinutes: 15,
  colorThresholdYellowMinutes: 60,
  colorThresholdGreenMinutes: 240,
  colorRedHex: '#EF4444',
  colorYellowHex: '#F59E0B',
  colorGreenHex: '#10B981',
  colorDefaultHex: '#6B7280',
};

export const useScheduledCallsSettingsStore = create<ScheduledCallsSettingsState>()(
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
      name: 'scheduled-calls-widget-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
