export interface WeatherAlertSeverityScheduleData {
  Severity: number;
  EnableNotification: boolean;
  NotificationSound: string;
}

export interface WeatherAlertSettingsData {
  WeatherAlertsEnabled: boolean;
  MinimumSeverity: number;
  SeveritySchedules: WeatherAlertSeverityScheduleData[];
}
