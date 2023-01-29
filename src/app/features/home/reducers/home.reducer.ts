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
    default:
      return state;
  }
}
