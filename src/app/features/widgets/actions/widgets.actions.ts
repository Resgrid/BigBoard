import { Action } from '@ngrx/store';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { PersonnelInfoResultData, CallResultData, UnitInfoResultData, NoteResultData, MapDataAndMarkersData, GpsLocation } from "@resgrid/ngx-resgridlib";
import { CallsWidgetSettings } from 'src/app/models/callsWidgetSettings';
import { UnitsWidgetSettings } from 'src/app/models/unitsWidgetSettings';
import { MapWidgetSettings } from 'src/app/models/mapWidgetSettings';
import { NotesWidgetSettings } from 'src/app/models/notesWidgetSettings';

export enum WidgetsActionTypes {
  GET_WEATHER_SETTTINGS = '[WIDGETS] GET_WEATHER_SETTTINGS',
  GET_WEATHER_SETTTINGS_DONE = '[WIDGETS] GET_WEATHER_SETTTINGS_DONE',
  SET_WEATHER_SETTINGS = '[WIDGETS] SET_WEATHER_SETTINGS',
  SET_WEATHER_SETTINGS_DONE = '[WIDGETS] SET_WEATHER_SETTINGS_DONE',
  SET_WEATHER_LOCATION = '[WIDGETS] SET_WEATHER_LOCATION',

  GET_PERSONNEL_SETTINGS = '[WIDGETS] GET_PERSONNEL_SETTINGS',
  GET_PERSONNEL_SETTINGS_DONE = '[WIDGETS] GET_PERSONNEL_SETTINGS_DONE',
  SET_PERSONNEL_SETTINGS = '[WIDGETS] SET_PERSONNEL_SETTINGS',
  SET_PERSONNEL_SETTINGS_DONE = '[WIDGETS] SET_PERSONNEL_SETTINGS_DONE',
  GET_PERSONNEL_STATUSES = '[WIDGETS] GET_PERSONNEL_STATUSES',
  GET_PERSONNEL_STATUSES_DONE = '[WIDGETS] GET_PERSONNEL_STATUSES_DONE',

  GET_CALLS = '[WIDGETS] GET_CALLS',
  GET_CALLS_DONE = '[WIDGETS] GET_CALLS_DONE',

  GET_UNITS = '[WIDGETS] GET_UNITS',
  GET_UNITS_DONE = '[WIDGETS] GET_UNITS_DONE',
  SET_UNITS_SETTINGS = '[WIDGETS] SET_UNITS_SETTINGS',
  SET_UNITS_SETTINGS_DONE = '[WIDGETS] SET_UNITS_SETTINGS_DONE',

  GET_NOTES = '[WIDGETS] GET_NOTES',
  GET_NOTES_DONE = '[WIDGETS] GET_NOTES_DONE',

  GET_MAPDATA = '[WIDGETS] GET_MAPDATA',
  GET_MAPDATA_DONE = '[WIDGETS] GET_MAPDATA_DONE',
  SET_MAP_SETTINGS = '[WIDGETS] SET_MAP_SETTINGS',
  SET_MAP_SETTINGS_DONE = '[WIDGETS] SET_MAP_SETTINGS_DONE',

  SET_CALLS_SETTINGS = '[WIDGETS] SET_CALLS_SETTINGS',
  SET_CALLS_SETTINGS_DONE = '[WIDGETS] SET_CALLS_SETTINGS_DONE',

  SET_NOTES_SETTINGS = '[WIDGETS] SET_NOTES_SETTINGS',
  SET_NOTES_SETTINGS_DONE = '[WIDGETS] SET_NOTES_SETTINGS_DONE',

  LOAD_ALL_WIDGET_SETTINGS = '[WIDGETS] LOAD_ALL_WIDGET_SETTINGS',
  LOAD_ALL_WIDGET_SETTINGS_DONE = '[WIDGETS] LOAD_ALL_WIDGET_SETTINGS_DONE',

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

export class SetWeatherSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_WEATHER_SETTINGS_DONE;
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

export class SetPersonnelSettings implements Action {
  readonly type = WidgetsActionTypes.SET_PERSONNEL_SETTINGS;
  constructor(public settings: PersonnelWidgetSettings) {}
}

export class SetPersonnelSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_PERSONNEL_SETTINGS_DONE;
  constructor(public settings: PersonnelWidgetSettings) {}
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

export class SetUnitSettings implements Action {
  readonly type = WidgetsActionTypes.SET_UNITS_SETTINGS;
  constructor(public settings: UnitsWidgetSettings) {}
}

export class SetUnitSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_UNITS_SETTINGS_DONE;
  constructor(public settings: UnitsWidgetSettings) {}
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

export class SetMapSettings implements Action {
  readonly type = WidgetsActionTypes.SET_MAP_SETTINGS;
  constructor(public settings: MapWidgetSettings) {}
}

export class SetMapSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_MAP_SETTINGS_DONE;
  constructor(public settings: MapWidgetSettings) {}
}

export class SetCallsSettings implements Action {
  readonly type = WidgetsActionTypes.SET_CALLS_SETTINGS;
  constructor(public settings: CallsWidgetSettings) {}
}

export class SetCallsSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_CALLS_SETTINGS_DONE;
  constructor(public settings: CallsWidgetSettings) {}
}

export class SetNotesSettings implements Action {
  readonly type = WidgetsActionTypes.SET_NOTES_SETTINGS;
  constructor(public settings: NotesWidgetSettings) {}
}

export class SetNotesSettingsDone implements Action {
  readonly type = WidgetsActionTypes.SET_NOTES_SETTINGS_DONE;
  constructor(public settings: NotesWidgetSettings) {}
}

export class LoadAllWidgetSettings implements Action {
  readonly type = WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS;
  constructor() {}
}

export class LoadAllWidgetSettingsDone implements Action {
  readonly type = WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS_DONE;
  constructor(public weatherWidgetSettings: WeatherWidgetSettings, public personnelWidgetSettings: PersonnelWidgetSettings, 
    public callsWidgetSettings: CallsWidgetSettings, public unitsWidgetSettings: UnitsWidgetSettings, 
    public notesWidgetSettings: NotesWidgetSettings, public mapWidgetSettings: MapWidgetSettings) {}
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
  | LoadAllWidgetSettings
  | LoadAllWidgetSettingsDone
  | SetPersonnelSettings
  | SetPersonnelSettingsDone
  | SetMapSettings
  | SetMapSettingsDone
  | SetWeatherSettingsDone
  | SetUnitSettings
  | SetUnitSettingsDone
  | SetCallsSettings
  | SetCallsSettingsDone
  | SetNotesSettings
  | SetNotesSettingsDone
  | Done
  ;
