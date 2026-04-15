import { create } from 'zustand';

import { getActiveAlerts, getSettings, getWeatherAlert } from '@/api/weatherAlerts/weatherAlerts';
import { logger } from '@/lib/logging';
import { type WeatherAlertResultData } from '@/models/v4/weatherAlerts/weatherAlertResultData';
import { type WeatherAlertSettingsData } from '@/models/v4/weatherAlerts/weatherAlertSettingsData';

interface WeatherAlertsState {
  alerts: WeatherAlertResultData[];
  isLoading: boolean;
  error: string | null;
  selectedAlert: WeatherAlertResultData | null;
  isLoadingDetail: boolean;
  settings: WeatherAlertSettingsData | null;

  fetchActiveAlerts: () => Promise<void>;
  fetchAlertDetail: (alertId: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  handleAlertReceived: (alertId: string) => Promise<void>;
  handleAlertUpdated: (alertId: string) => Promise<void>;
  handleAlertExpired: (alertId: string) => void;
  init: () => Promise<void>;
  reset: () => void;
}

const sortAlerts = (alerts: WeatherAlertResultData[]): WeatherAlertResultData[] => {
  return [...alerts].sort((a, b) => {
    // Sort by severity descending (Extreme=4 first)
    if (b.Severity !== a.Severity) {
      return b.Severity - a.Severity;
    }
    // Then by EffectiveUtc descending (newest first)
    return new Date(b.EffectiveUtc).getTime() - new Date(a.EffectiveUtc).getTime();
  });
};

export const useWeatherAlertsStore = create<WeatherAlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,
  selectedAlert: null,
  isLoadingDetail: false,
  settings: null,

  fetchActiveAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getActiveAlerts();
      set({ alerts: sortAlerts(result.Data), isLoading: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch active weather alerts', context: { error } });
      set({ error: 'Failed to fetch weather alerts', isLoading: false });
    }
  },

  fetchAlertDetail: async (alertId: string) => {
    set({ isLoadingDetail: true });
    try {
      const result = await getWeatherAlert(alertId);
      set({ selectedAlert: result.Data, isLoadingDetail: false });
    } catch (error) {
      logger.error({ message: 'Failed to fetch weather alert detail', context: { error, alertId } });
      set({ isLoadingDetail: false });
    }
  },

  fetchSettings: async () => {
    try {
      const result = await getSettings();
      set({ settings: result.Data });
    } catch (error) {
      logger.error({ message: 'Failed to fetch weather alert settings', context: { error } });
    }
  },

  handleAlertReceived: async (alertId: string) => {
    try {
      const result = await getWeatherAlert(alertId);
      const { alerts } = get();
      set({ alerts: sortAlerts([result.Data, ...alerts]) });
    } catch (error) {
      logger.error({ message: 'Failed to handle received weather alert', context: { error, alertId } });
    }
  },

  handleAlertUpdated: async (alertId: string) => {
    try {
      const result = await getWeatherAlert(alertId);
      const { alerts } = get();
      const updated = alerts.map((a) => (a.WeatherAlertId === alertId ? result.Data : a));
      set({ alerts: sortAlerts(updated) });
    } catch (error) {
      logger.error({ message: 'Failed to handle updated weather alert', context: { error, alertId } });
    }
  },

  handleAlertExpired: (alertId: string) => {
    const { alerts } = get();
    set({ alerts: alerts.filter((a) => a.WeatherAlertId !== alertId) });
  },

  init: async () => {
    await get().fetchSettings();
    const { settings } = get();
    if (settings?.WeatherAlertsEnabled === false) {
      logger.info({ message: 'Weather alerts disabled, skipping alert fetch' });
      return;
    }
    await get().fetchActiveAlerts();
  },

  reset: () => {
    set({
      alerts: [],
      isLoading: false,
      error: null,
      selectedAlert: null,
      isLoadingDetail: false,
      settings: null,
    });
  },
}));
