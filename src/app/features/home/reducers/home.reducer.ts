import { HomeActionsUnion, HomeActionTypes } from '../actions/home.actions';
import { HomeState, initialState } from '../store/home.store';
import * as _ from 'lodash';

export function reducer(
  state: HomeState = initialState,
  action: HomeActionsUnion
): HomeState {
  switch (action.type) {
    case HomeActionTypes.UPDATE_SIGNALR_STATE:
      let connected = state.connected;
      let status = state.status;
      let statusColor = state.statusColor;

      if (action.state === 0) {
        connected = false;
        status = 'Disconnected';
        statusColor = 'red';
      } else if (action.state === 1) {
        connected = false;
        status = 'Connecting to Resgrid...';
        statusColor = 'orange';
      } else if (action.state === 2) {
        connected = true;
        status = 'Connected';
        statusColor = 'green';
      }

      return {
        ...state,
        lastUpdated: new Date(),
        connected: connected,
        status: status,
        statusColor: statusColor,
      };
    case HomeActionTypes.ADD_WIDGET:  
      return {
        ...state,
        widgets: [...state.widgets, action.widget],
      };
    case HomeActionTypes.UPDATE_WIDGET_LAYOUT:
      const updatingWidgets = _.cloneDeep(state.widgets);

      for (const layoutItem of action.layout) {
        for (const widget of updatingWidgets) {
          if (widget.id === layoutItem.id) {
            widget.x = layoutItem.x;
            widget.y = layoutItem.y;
            widget.w = layoutItem.w;
            widget.h = layoutItem.h;
          }
        }
      }
      return {
        ...state,
        widgets: updatingWidgets,
      };
    default:
      return state;
  }
}

export const getWidgets = (state: HomeState) =>
  state.widgets;