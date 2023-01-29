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