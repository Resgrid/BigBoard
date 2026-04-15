export enum WeatherAlertSeverity {
  Unknown = 0,
  Minor = 1,
  Moderate = 2,
  Severe = 3,
  Extreme = 4,
}

export enum WeatherAlertCategory {
  Unknown = 0,
  Geo = 1,
  Met = 2,
  Safety = 3,
  Security = 4,
  Rescue = 5,
  Fire = 6,
  Health = 7,
  Env = 8,
  Transport = 9,
  Infra = 10,
  CBRNE = 11,
  Other = 12,
}

export enum WeatherAlertUrgency {
  Unknown = 0,
  Immediate = 1,
  Expected = 2,
  Future = 3,
  Past = 4,
}

export enum WeatherAlertCertainty {
  Unknown = 0,
  Observed = 1,
  Likely = 2,
  Possible = 3,
  Unlikely = 4,
}

export enum WeatherAlertStatus {
  Unknown = 0,
  Actual = 1,
  Exercise = 2,
  System = 3,
  Test = 4,
  Draft = 5,
}

export enum WeatherAlertSourceType {
  Unknown = 0,
  NWS = 1,
  EnvironmentCanada = 2,
  MeteoAlarm = 3,
}

export const SEVERITY_COLORS: Record<WeatherAlertSeverity, string> = {
  [WeatherAlertSeverity.Extreme]: '#7B2D8B',
  [WeatherAlertSeverity.Severe]: '#DC2626',
  [WeatherAlertSeverity.Moderate]: '#EA580C',
  [WeatherAlertSeverity.Minor]: '#CA8A04',
  [WeatherAlertSeverity.Unknown]: '#6B7280',
};

export const SEVERITY_LABELS: Record<WeatherAlertSeverity, string> = {
  [WeatherAlertSeverity.Extreme]: 'Extreme',
  [WeatherAlertSeverity.Severe]: 'Severe',
  [WeatherAlertSeverity.Moderate]: 'Moderate',
  [WeatherAlertSeverity.Minor]: 'Minor',
  [WeatherAlertSeverity.Unknown]: 'Unknown',
};
