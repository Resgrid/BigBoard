import { initialState, WidgetsState } from '../store/widgets.store';
import {
  WidgetsActionsUnion,
  WidgetsActionTypes,
} from '../actions/widgets.actions';

import * as _ from 'lodash';
import { CallsWidgetSettings } from 'src/app/models/callsWidgetSettings';
import { NotesWidgetSettings } from 'src/app/models/notesWidgetSettings';
import { UnitsWidgetSettings } from 'src/app/models/unitsWidgetSettings';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { MapWidgetSettings } from 'src/app/models/mapWidgetSettings';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { PTTWidgetSettings } from 'src/app/models/pttWidgetSettings';

export function reducer(
  state: WidgetsState = initialState,
  action: WidgetsActionsUnion,
): WidgetsState {
  switch (action.type) {
    case WidgetsActionTypes.GET_WEATHER_SETTTINGS_DONE:
      return {
        ...state,
        weatherWidgetSettings: action.settings,
      };
    case WidgetsActionTypes.GET_PERSONNEL_STATUSES_DONE:
      return {
        ...state,
        personnel: action.statuses,
      };
    case WidgetsActionTypes.GET_CALLS_DONE:
      return {
        ...state,
        calls: action.calls,
      };
    case WidgetsActionTypes.GET_UNITS_DONE:
      return {
        ...state,
        units: action.units,
      };
    case WidgetsActionTypes.GET_NOTES_DONE:
      return {
        ...state,
        notes: action.notes,
      };
    case WidgetsActionTypes.GET_MAPDATA_DONE:
      return {
        ...state,
        mapData: action.data,
      };
    case WidgetsActionTypes.SET_WEATHER_LOCATION:
      return {
        ...state,
        location: action.location,
      };
    case WidgetsActionTypes.SET_PERSONNEL_SETTINGS_DONE:
      let personnelWidgetSettings: PersonnelWidgetSettings;

      if (action.settings) {
        personnelWidgetSettings = action.settings;
      } else {
        personnelWidgetSettings = new PersonnelWidgetSettings();
      }

      return {
        ...state,
        personnelWidgetSettings: personnelWidgetSettings,
      };
    case WidgetsActionTypes.SET_MAP_SETTINGS_DONE:
      let mapWidgetSettings: MapWidgetSettings;

      if (action.settings) {
        mapWidgetSettings = action.settings;
      } else {
        mapWidgetSettings = new MapWidgetSettings();
      }

      return {
        ...state,
        mapWidgetSettings: mapWidgetSettings,
      };
    case WidgetsActionTypes.SET_WEATHER_SETTINGS_DONE:
      let weatherWidgetSettings: WeatherWidgetSettings;

      if (action.settings) {
        weatherWidgetSettings = action.settings;
      } else {
        weatherWidgetSettings = new WeatherWidgetSettings();
      }

      return {
        ...state,
        weatherWidgetSettings: weatherWidgetSettings,
      };
    case WidgetsActionTypes.SET_UNITS_SETTINGS_DONE:
      let unitWidgetSettings: UnitsWidgetSettings;

      if (action.settings) {
        unitWidgetSettings = action.settings;
      } else {
        unitWidgetSettings = new UnitsWidgetSettings();
      }

      return {
        ...state,
        unitsWidgetSettings: unitWidgetSettings,
      };
    case WidgetsActionTypes.SET_CALLS_SETTINGS_DONE:
      let callWidgetSettings: CallsWidgetSettings;

      if (action.settings) {
        callWidgetSettings = action.settings;
      } else {
        callWidgetSettings = new CallsWidgetSettings();
      }

      return {
        ...state,
        callsWidgetSettings: callWidgetSettings,
      };
    case WidgetsActionTypes.SET_NOTES_SETTINGS_DONE:
      let noteWidgetSettings: NotesWidgetSettings;

      if (action.settings) {
        noteWidgetSettings = action.settings;
      } else {
        noteWidgetSettings = new NotesWidgetSettings();
      }

      return {
        ...state,
        notesWidgetSettings: noteWidgetSettings,
      };
    case WidgetsActionTypes.SET_PTT_SETTINGS_DONE:
      let pttWidgetSettings: PTTWidgetSettings;

      if (action.settings) {
        pttWidgetSettings = action.settings;
      } else {
        pttWidgetSettings = new PTTWidgetSettings();
      }

      return {
        ...state,
        pttWidgetSettings: pttWidgetSettings,
      };
    case WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS_DONE:
      let weatherWidgetSettingsAll: WeatherWidgetSettings;
      let personnelWidgetSettingsAll: PersonnelWidgetSettings;
      let callsWidgetSettingsAll: CallsWidgetSettings;
      let unitsWidgetSettingsAll: UnitsWidgetSettings;
      let notesWidgetSettingsAll: NotesWidgetSettings;
      let mapWidgetSettingsAll: MapWidgetSettings;
      let pttWidgetSettingsAll: PTTWidgetSettings;

      if (action.weatherWidgetSettings) {
        weatherWidgetSettingsAll = action.weatherWidgetSettings;
      } else {
        weatherWidgetSettingsAll = new WeatherWidgetSettings();
      }

      if (action.personnelWidgetSettings) {
        personnelWidgetSettingsAll = action.personnelWidgetSettings;
      } else {
        personnelWidgetSettingsAll = new PersonnelWidgetSettings();
      }

      if (action.callsWidgetSettings) {
        callsWidgetSettingsAll = action.callsWidgetSettings;
      } else {
        callsWidgetSettingsAll = new CallsWidgetSettings();
      }

      if (action.unitsWidgetSettings) {
        unitsWidgetSettingsAll = action.unitsWidgetSettings;
      } else {
        unitsWidgetSettingsAll = new UnitsWidgetSettings();
      }

      if (action.notesWidgetSettings) {
        notesWidgetSettingsAll = action.notesWidgetSettings;
      } else {
        notesWidgetSettingsAll = new NotesWidgetSettings();
      }

      if (action.mapWidgetSettings) {
        mapWidgetSettingsAll = action.mapWidgetSettings;
      } else {
        mapWidgetSettingsAll = new MapWidgetSettings();
      }

      if (action.pttWidgetSettings) {
        pttWidgetSettingsAll = action.pttWidgetSettings;
      } else {
        pttWidgetSettingsAll = new PTTWidgetSettings();
      }

      return {
        ...state,
        weatherWidgetSettings: weatherWidgetSettingsAll,
        personnelWidgetSettings: personnelWidgetSettingsAll,
        callsWidgetSettings: callsWidgetSettingsAll,
        unitsWidgetSettings: unitsWidgetSettingsAll,
        notesWidgetSettings: notesWidgetSettingsAll,
        mapWidgetSettings: mapWidgetSettingsAll,
        pttWidgetSettings: pttWidgetSettingsAll,
      };
    default:
      return state;
  }
}

export const getWeatherWidgetSettings = (state: WidgetsState) =>
  state.weatherWidgetSettings;
export const getPersonnelWidgetSettings = (state: WidgetsState) =>
  state.personnelWidgetSettings;
export const getCallsWidgetSettings = (state: WidgetsState) =>
  state.callsWidgetSettings;
export const getUnitsWidgetSettings = (state: WidgetsState) =>
  state.unitsWidgetSettings;
export const getNotesWidgetSettings = (state: WidgetsState) =>
  state.notesWidgetSettings;
export const getMapWidgetSettings = (state: WidgetsState) =>
  state.mapWidgetSettings;
export const getPTTWidgetSettings = (state: WidgetsState) =>
  state.pttWidgetSettings;
export const getMapWidgetData = (state: WidgetsState) => state.mapData;
export const getWeatherWidgetLocation = (state: WidgetsState) => state.location;
