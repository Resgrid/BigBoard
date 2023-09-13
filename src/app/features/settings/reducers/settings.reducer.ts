import * as _ from 'lodash';
import { initialState, SettingsState } from '../store/settings.store';
import {
  SettingActionTypes,
  SettingsActionsUnion,
} from '../actions/settings.actions';

export function reducer(
  state: SettingsState = initialState,
  action: SettingsActionsUnion,
): SettingsState {
  switch (action.type) {
    case SettingActionTypes.IS_LOGIN:
      return {
        ...state,
        isLogging: true,
      };
    case SettingActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        loggedIn: true,
        user: action.user,
      };
    case SettingActionTypes.SET_LOGINDATA_NAV_HOME:
      return {
        ...state,
        loggedIn: true,
        user: action.user,
        themePreference: action.themePreference,
        keepAlive: action.keepAlive,
      };
    case SettingActionTypes.LOGIN_FAIL:
      return {
        ...state,
        errorMsg: 'Invalid user credentials',
        isLogging: false,
      };
    case SettingActionTypes.IS_LOGIN:
      return {
        ...state,
        isLogging: true,
      };
    case SettingActionTypes.LOGIN_DONE:
      return {
        ...state,
        isLogging: false,
      };
    case SettingActionTypes.SAVE_PERFER_DARKMODE_SETTING:
      return {
        ...state,
        themePreference: action.themePreference,
      };
    case SettingActionTypes.SAVE_KEEP_ALIVE_SETTING:
      return {
        ...state,
        keepAlive: action.keepAlive,
      };
    case SettingActionTypes.SET_APP_SETTINGS:
      return {
        ...state,
        keepAlive: action.keepAlive,
        themePreference: action.themePreference,
      };
    case SettingActionTypes.LOGOUT:
      return {
        ...state,
        loggedIn: false,
        errorMsg: null,
        isLogging: false,
        user: null,
        themePreference: -1,
        keepAlive: false,
      };
    case SettingActionTypes.SET_IS_APP_ACTIVE:
      return {
        ...state,
        isAppActive: action.isActive,
      };
    case SettingActionTypes.GET_APP_SETTINGS_FROM_SERVER_DONE:
      return {
        ...state,
        appSettings: action.appSettings,
      };
    case SettingActionTypes.SAVE_PERFER_DARKMODE_SETTING_DONE:
      return {
        ...state,
        themePreference: action.themePreference,
      };
    default:
      return state;
  }
}

export const getIsLoggedInState = (state: SettingsState) => state.loggedIn;
export const getKeepAliveState = (state: SettingsState) => state.keepAlive;
export const getIsAppActiveState = (state: SettingsState) => state.isAppActive;
export const getThemePreferenceState = (state: SettingsState) =>
  state.themePreference;
export const getAppSettingsState = (state: SettingsState) => state.appSettings;
