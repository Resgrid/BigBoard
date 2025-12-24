import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Widget Settings Interfaces
export interface GroupSorting {
  groupId: string;
  weight: number;
}

export interface PersonnelWidgetSettings {
  showGroup: boolean;
  showStaffing: boolean;
  showStatus: boolean;
  showRoles: boolean;
  showTimestamp: boolean;
  sortRespondingToTop: boolean;
  respondingText: string;
  hideNotResponding: boolean;
  notRespondingText: string;
  hideUnavailable: boolean;
  unavailableText: string;
  fontSize: number;
  hideGroups: string[];
  sortOrders: GroupSorting[];
}

export interface MapWidgetSettings {
  zoomLevel: number;
  showAllMarkers: boolean;
  hideLabels: boolean;
  showCalls: boolean;
  showLinkedCalls: boolean;
  showStations: boolean;
  showUnits: boolean;
  showPersonnel: boolean;
  latitude: number;
  longitude: number;
}

export interface WeatherWidgetSettings {
  units: 'standard' | 'metric' | 'imperial';
  latitude: number;
  longitude: number;
}

export interface UnitsWidgetSettings {
  showStation: boolean;
  showType: boolean;
  showState: boolean;
  showTimestamp: boolean;
  fontSize: number;
  hideGroups: string[];
  sortOrders: GroupSorting[];
}

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

export interface NotesWidgetSettings {
  category: string;
  includeUncategorized: boolean;
}

export interface TimeWidgetSettings {
  format24Hour: boolean;
  showSeconds: boolean;
}

export interface PersonnelStatusSummarySettings {
  fontSize: number;
  showColors: boolean;
}

export interface PersonnelStaffingSummarySettings {
  fontSize: number;
  showColors: boolean;
}

export interface UnitsSummarySettings {
  fontSize: number;
  showAvailable: boolean;
  showResponding: boolean;
  showOnScene: boolean;
}

export interface CallsSummarySettings {
  fontSize: number;
  showRecentCall: boolean;
  showPriorityCounts: boolean;
  maxPrioritiesToShow: number;
}

interface WidgetSettingsState {
  personnel: PersonnelWidgetSettings;
  map: MapWidgetSettings;
  weather: WeatherWidgetSettings;
  units: UnitsWidgetSettings;
  calls: CallsWidgetSettings;
  notes: NotesWidgetSettings;
  time: TimeWidgetSettings;
  personnelStatusSummary: PersonnelStatusSummarySettings;
  personnelStaffingSummary: PersonnelStaffingSummarySettings;
  unitsSummary: UnitsSummarySettings;
  callsSummary: CallsSummarySettings;

  // Actions
  updatePersonnelSettings: (settings: Partial<PersonnelWidgetSettings>) => void;
  updateMapSettings: (settings: Partial<MapWidgetSettings>) => void;
  updateWeatherSettings: (settings: Partial<WeatherWidgetSettings>) => void;
  updateUnitsSettings: (settings: Partial<UnitsWidgetSettings>) => void;
  updateCallsSettings: (settings: Partial<CallsWidgetSettings>) => void;
  updateNotesSettings: (settings: Partial<NotesWidgetSettings>) => void;
  updateTimeSettings: (settings: Partial<TimeWidgetSettings>) => void;
  updatePersonnelStatusSummarySettings: (settings: Partial<PersonnelStatusSummarySettings>) => void;
  updatePersonnelStaffingSummarySettings: (settings: Partial<PersonnelStaffingSummarySettings>) => void;
  updateUnitsSummarySettings: (settings: Partial<UnitsSummarySettings>) => void;
  updateCallsSummarySettings: (settings: Partial<CallsSummarySettings>) => void;
  resetAllSettings: () => void;
}

// Default settings
const defaultPersonnelSettings: PersonnelWidgetSettings = {
  showGroup: true,
  showStaffing: true,
  showStatus: true,
  showRoles: true,
  showTimestamp: true,
  sortRespondingToTop: true,
  respondingText: 'Responding',
  hideNotResponding: false,
  notRespondingText: 'Not Responding',
  hideUnavailable: false,
  unavailableText: 'Unavailable',
  fontSize: 14,
  hideGroups: [],
  sortOrders: [],
};

const defaultMapSettings: MapWidgetSettings = {
  zoomLevel: 12,
  showAllMarkers: true,
  hideLabels: false,
  showCalls: true,
  showLinkedCalls: true,
  showStations: true,
  showUnits: true,
  showPersonnel: true,
  latitude: 0,
  longitude: 0,
};

const defaultWeatherSettings: WeatherWidgetSettings = {
  units: 'imperial',
  latitude: 0,
  longitude: 0,
};

const defaultUnitsSettings: UnitsWidgetSettings = {
  showStation: true,
  showType: true,
  showState: true,
  showTimestamp: true,
  fontSize: 14,
  hideGroups: [],
  sortOrders: [],
};

const defaultCallsSettings: CallsWidgetSettings = {
  showId: true,
  showName: true,
  showTimestamp: true,
  showUser: true,
  showPriority: true,
  showAddress: true,
  showLinkedCalls: true,
  fontSize: 14,
};

const defaultNotesSettings: NotesWidgetSettings = {
  category: 'None',
  includeUncategorized: true,
};

const defaultTimeSettings: TimeWidgetSettings = {
  format24Hour: false,
  showSeconds: true,
};

const defaultPersonnelStatusSummarySettings: PersonnelStatusSummarySettings = {
  fontSize: 14,
  showColors: true,
};

const defaultPersonnelStaffingSummarySettings: PersonnelStaffingSummarySettings = {
  fontSize: 14,
  showColors: true,
};

const defaultUnitsSummarySettings: UnitsSummarySettings = {
  fontSize: 14,
  showAvailable: true,
  showResponding: true,
  showOnScene: true,
};

const defaultCallsSummarySettings: CallsSummarySettings = {
  fontSize: 14,
  showRecentCall: true,
  showPriorityCounts: true,
  maxPrioritiesToShow: 3,
};

const STORAGE_KEY = 'widget-settings';

// Create MMKV storage instance
const storage = new MMKV();

// MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export const useWidgetSettingsStore = create<WidgetSettingsState>()(
  persist(
    (set) => ({
      personnel: defaultPersonnelSettings,
      map: defaultMapSettings,
      weather: defaultWeatherSettings,
      units: defaultUnitsSettings,
      calls: defaultCallsSettings,
      notes: defaultNotesSettings,
      time: defaultTimeSettings,
      personnelStatusSummary: defaultPersonnelStatusSummarySettings,
      personnelStaffingSummary: defaultPersonnelStaffingSummarySettings,
      unitsSummary: defaultUnitsSummarySettings,
      callsSummary: defaultCallsSummarySettings,

      updatePersonnelSettings: (settings) =>
        set((state) => ({
          personnel: { ...state.personnel, ...settings },
        })),

      updateMapSettings: (settings) =>
        set((state) => ({
          map: { ...state.map, ...settings },
        })),

      updateWeatherSettings: (settings) =>
        set((state) => ({
          weather: { ...state.weather, ...settings },
        })),

      updateUnitsSettings: (settings) =>
        set((state) => ({
          units: { ...state.units, ...settings },
        })),

      updateCallsSettings: (settings) =>
        set((state) => ({
          calls: { ...state.calls, ...settings },
        })),

      updateNotesSettings: (settings) =>
        set((state) => ({
          notes: { ...state.notes, ...settings },
        })),

      updateTimeSettings: (settings) =>
        set((state) => ({
          time: { ...state.time, ...settings },
        })),

      updatePersonnelStatusSummarySettings: (settings) =>
        set((state) => ({
          personnelStatusSummary: { ...state.personnelStatusSummary, ...settings },
        })),

      updatePersonnelStaffingSummarySettings: (settings) =>
        set((state) => ({
          personnelStaffingSummary: { ...state.personnelStaffingSummary, ...settings },
        })),

      updateUnitsSummarySettings: (settings) =>
        set((state) => ({
          unitsSummary: { ...state.unitsSummary, ...settings },
        })),

      updateCallsSummarySettings: (settings) =>
        set((state) => ({
          callsSummary: { ...state.callsSummary, ...settings },
        })),

      resetAllSettings: () =>
        set({
          personnel: defaultPersonnelSettings,
          map: defaultMapSettings,
          weather: defaultWeatherSettings,
          units: defaultUnitsSettings,
          calls: defaultCallsSettings,
          notes: defaultNotesSettings,
          time: defaultTimeSettings,
          personnelStatusSummary: defaultPersonnelStatusSummarySettings,
          personnelStaffingSummary: defaultPersonnelStaffingSummarySettings,
          unitsSummary: defaultUnitsSummarySettings,
          callsSummary: defaultCallsSummarySettings,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
