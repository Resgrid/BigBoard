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

/**
 * Translation keys rather than labels: severity is shown to dispatchers on every alert surface, and
 * a table of English strings here silently overrode the translations the dictionaries already
 * carried. Resolve with t()/translate() at render time so the label follows the chosen language.
 */
// `as const` keeps these as literal types so they satisfy translate()'s TxKeyPath; `satisfies`
// still enforces that every severity has one.
export const SEVERITY_LABEL_KEYS = {
  [WeatherAlertSeverity.Extreme]: 'weatherAlerts.severity.extreme',
  [WeatherAlertSeverity.Severe]: 'weatherAlerts.severity.severe',
  [WeatherAlertSeverity.Moderate]: 'weatherAlerts.severity.moderate',
  [WeatherAlertSeverity.Minor]: 'weatherAlerts.severity.minor',
  [WeatherAlertSeverity.Unknown]: 'weatherAlerts.severity.unknown',
} as const satisfies Record<WeatherAlertSeverity, string>;
