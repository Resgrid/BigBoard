import { initialState, WidgetsState } from '../store/widgets.store';
import { WidgetsActionsUnion, WidgetsActionTypes } from '../actions/widgets.actions';

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
    default:
      return state;
  }
}

export const getWeatherWidgetSettings = (state: WidgetsState) => state.weatherWidgetSettings;