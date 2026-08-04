// Values must match the Resgrid Core backend (Resgrid.Model.WeatherAlertSeverity):
// lower number = higher severity, Unknown is the lowest priority.
export enum WeatherAlertSeverity {
  Extreme = 0,
  Severe = 1,
  Moderate = 2,
  Minor = 3,
  Unknown = 4,
}

// Values must match the Resgrid Core backend (Resgrid.Model.WeatherAlertCategory).
export enum WeatherAlertCategory {
  Met = 0,
  Fire = 1,
  Health = 2,
  Env = 3,
  Other = 4,
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
