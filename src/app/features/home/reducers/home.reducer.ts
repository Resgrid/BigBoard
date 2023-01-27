import { HomeActionsUnion, HomeActionTypes } from '../actions/home.actions';
import { HomeState, initialState } from '../store/home.store';
import * as _ from 'lodash';

export function reducer(
  state: HomeState = initialState,
  action: HomeActionsUnion
): HomeState {
  switch (action.type) {
    default:
      return state;
  }
}