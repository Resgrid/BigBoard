import { initialState, WidgetsState } from '../store/widgets.store';
import {
  WidgetsActionsUnion,
  WidgetsActionTypes,
} from '../actions/widgets.actions';

import * as _ from 'lodash';

export function reducer(
  state: WidgetsState = initialState,
  action: WidgetsActionsUnion
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
    case WidgetsActionTypes.LOAD_ALL_WIDGET_SETTINGS_DONE:
      return {
        ...state,
        weatherWidgetSettings: action.weatherWidgetSettings,
        personnelWidgetSettings: action.personnelWidgetSettings,
        callsWidgetSettings: action.callsWidgetSettings,
        unitsWidgetSettings: action.unitsWidgetSettings,
        notesWidgetSettings: action.notesWidgetSettings,
        mapWidgetSettings: action.mapWidgetSettings,
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
export const getMapWidgetData = (state: WidgetsState) => state.mapData;
export const getWeatherWidgetLocation = (state: WidgetsState) => state.location;
