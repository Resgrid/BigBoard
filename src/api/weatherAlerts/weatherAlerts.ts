import { type ActiveWeatherAlertsResult } from '@/models/v4/weatherAlerts/activeWeatherAlertsResult';
import { type WeatherAlertResult } from '@/models/v4/weatherAlerts/weatherAlertResult';
import { type WeatherAlertSettingsResult } from '@/models/v4/weatherAlerts/weatherAlertSettingsResult';
import { type WeatherAlertZonesResult } from '@/models/v4/weatherAlerts/weatherAlertZonesResult';

import { createApiEndpoint } from '../common/client';

const activeAlertsApi = createApiEndpoint('/WeatherAlerts/GetActiveAlerts');
const getAlertApi = createApiEndpoint('/WeatherAlerts/GetWeatherAlert');
const alertsNearLocationApi = createApiEndpoint('/WeatherAlerts/GetAlertsNearLocation');
const alertHistoryApi = createApiEndpoint('/WeatherAlerts/GetAlertHistory');
const settingsApi = createApiEndpoint('/WeatherAlerts/GetSettings');
const zonesApi = createApiEndpoint('/WeatherAlerts/GetZones');

export const getActiveAlerts = async () => {
  const response = await activeAlertsApi.get<ActiveWeatherAlertsResult>();
  return response.data;
};

export const getWeatherAlert = async (alertId: string) => {
  const response = await getAlertApi.get<WeatherAlertResult>({
    alertId: encodeURIComponent(alertId),
  });
  return response.data;
};

export const getAlertsNearLocation = async (lat: number, lng: number, radiusMiles: number) => {
  const response = await alertsNearLocationApi.get<ActiveWeatherAlertsResult>({
    lat,
    lng,
    radiusMiles,
  });
  return response.data;
};

export const getAlertHistory = async (startDate: string, endDate: string) => {
  const response = await alertHistoryApi.get<ActiveWeatherAlertsResult>({
    startDate,
    endDate,
  });
  return response.data;
};

export const getSettings = async () => {
  const response = await settingsApi.get<WeatherAlertSettingsResult>();
  return response.data;
};

export const getZones = async () => {
  const response = await zonesApi.get<WeatherAlertZonesResult>();
  return response.data;
};
