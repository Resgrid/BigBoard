import { Action } from '@ngrx/store';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { PersonnelInfoResultData, CallResultData, UnitInfoResultData, NoteResultData, MapDataAndMarkersData, GpsLocation } from "@resgrid/ngx-resgridlib";

export enum WidgetsActionTypes {
  GET_WEATHER_SETTTINGS = '[WIDGETS] GET_WEATHER_SETTTINGS',
  GET_WEATHER_SETTTINGS_DONE = '[WIDGETS] GET_WEATHER_SETTTINGS_DONE',
  SET_WEATHER_SETTINGS = '[WIDGETS] SET_WEATHER_SETTINGS',
  SET_WEATHER_SETTINGS_DONE = '[WIDGETS] SET_WEATHER_SETTINGS_DONE',
  SET_WEATHER_LOCATION = '[WIDGETS] SET_WEATHER_LOCATION',

  GET_PERSONNEL_SETTINGS = '[WIDGETS] GET_PERSONNEL_SETTINGS',
  GET_PERSONNEL_SETTINGS_DONE = '[WIDGETS] GET_PERSONNEL_SETTINGS_DONE',
  GET_PERSONNEL_STATUSES = '[WIDGETS] GET_PERSONNEL_STATUSES',
  GET_PERSONNEL_STATUSES_DONE = '[WIDGETS] GET_PERSONNEL_STATUSES_DONE',

  GET_CALLS = '[WIDGETS] GET_CALLS',
  GET_CALLS_DONE = '[WIDGETS] GET_CALLS_DONE',

  GET_UNITS = '[WIDGETS] GET_UNITS',
  GET_UNITS_DONE = '[WIDGETS] GET_UNITS_DONE',

  GET_NOTES = '[WIDGETS] GET_NOTES',
  GET_NOTES_DONE = '[WIDGETS] GET_NOTES_DONE',

  GET_MAPDATA = '[WIDGETS] GET_MAPDATA',
  GET_MAPDATA_DONE = '[WIDGETS] GET_MAPDATA_DONE',

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

export class GetPersonnelSettings implements Action {
  readonly type = WidgetsActionTypes.GET_PERSONNEL_SETTINGS;
  constructor() {}
}

export class GetPersonnelSettingsDone implements Action {
  readonly type = WidgetsActionTypes.GET_PERSONNEL_SETTINGS_DONE;
  constructor(public settings: PersonnelWidgetSettings) {}
}

export class GetPersonnelStatuses implements Action {
  readonly type = WidgetsActionTypes.GET_PERSONNEL_STATUSES;
  constructor() {}
}

export class GetPersonnelStatusesDone implements Action {
  readonly type = WidgetsActionTypes.GET_PERSONNEL_STATUSES_DONE;
  constructor(public statuses: PersonnelInfoResultData[]) {}
}

export class GetCalls implements Action {
  readonly type = WidgetsActionTypes.GET_CALLS;
  constructor() {}
}

export class GetCallsDone implements Action {
  readonly type = WidgetsActionTypes.GET_CALLS_DONE;
  constructor(public calls: CallResultData[]) {}
}

export class GetUnits implements Action {
  readonly type = WidgetsActionTypes.GET_UNITS;
  constructor() {}
}

export class GetUnitsDone implements Action {
  readonly type = WidgetsActionTypes.GET_UNITS_DONE;
  constructor(public units: UnitInfoResultData[]) {}
}

export class GetNotes implements Action {
  readonly type = WidgetsActionTypes.GET_NOTES;
  constructor() {}
}

export class GetNotesDone implements Action {
  readonly type = WidgetsActionTypes.GET_NOTES_DONE;
  constructor(public notes: NoteResultData[]) {}
}

export class GetMapData implements Action {
  readonly type = WidgetsActionTypes.GET_MAPDATA;
  constructor() {}
}

export class GetMapDataDone implements Action {
  readonly type = WidgetsActionTypes.GET_MAPDATA_DONE;
  constructor(public data: MapDataAndMarkersData) {}
}

export class SetWeatherLocation implements Action {
  readonly type = WidgetsActionTypes.SET_WEATHER_LOCATION;
  constructor(public location: GpsLocation) {}
}

export class Done implements Action {
  readonly type = WidgetsActionTypes.DONE;
  constructor() {}
}

export type WidgetsActionsUnion =
  | GetWeatherSettings
  | GetWeatherSettingsDone
  | SetWeatherSettings
  | GetPersonnelSettings
  | GetPersonnelSettingsDone
  | GetPersonnelStatuses
  | GetPersonnelStatusesDone
  | GetCalls
  | GetCallsDone
  | GetUnits
  | GetUnitsDone
  | GetNotes
  | GetNotesDone
  | GetMapData
  | GetMapDataDone
  | SetWeatherLocation
  | Done
  ;
