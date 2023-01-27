import { Action } from '@ngrx/store';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';

export enum WidgetsActionTypes {
  GET_WEATHER_SETTTINGS = '[WIDGETS] GET_WEATHER_SETTTINGS',
  GET_WEATHER_SETTTINGS_DONE = '[WIDGETS] GET_WEATHER_SETTTINGS_DONE',
  SET_WEATHER_SETTINGS = '[WIDGETS] SET_WEATHER_SETTINGS',
  SET_WEATHER_SETTINGS_DONE = '[WIDGETS] SET_WEATHER_SETTINGS_DONE',
  DONE = '[WIDGETS] DONE',
}

export class GetWeatherSettings implements Action {
  readonly type = WidgetsActionTypes.GET_WEATHER_SETTTINGS;
  constructor() {}
}

export class GetWeatherSettingsDone implements Action {
  readonly type = WidgetsActionTypes.GET_WEATHER_SETTTINGS_DONE;
  constructor(public settings: WeatherWidgetSettings) {}
}

export class SetWeatherSettings implements Action {
  readonly type = WidgetsActionTypes.SET_WEATHER_SETTINGS;
  constructor(public settings: WeatherWidgetSettings) {}
}

export class Done implements Action {
  readonly type = WidgetsActionTypes.DONE;
  constructor() {}
}

export type WidgetsActionsUnion =
  | GetWeatherSettings
  | GetWeatherSettingsDone
  | SetWeatherSettings
  | Done
  ;
