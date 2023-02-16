import { Action } from '@ngrx/store';
import { CallPriorityResultData, CallResultData, GetConfigResultData, UnitResultData, UnitTypeStatusResultData } from '@resgrid/ngx-resgridlib';
import { UserInfo } from 'src/app/models/userInfo';
import { LoginPayload } from '../models/loginPayload';

export enum SettingActionTypes {
  SHOW_LOGIN_MODAL = '[SETTINGS] SHOW_LOGIN_MODAL',
  LOGIN = '[SETTINGS] LOGIN',
  LOGIN_SUCCESS = '[SETTINGS] LOGIN_SUCCESS',
  LOGIN_FAIL = '[SETTINGS] LOGIN_FAIL',
  IS_LOGIN = '[SETTINGS] IS_LOGIN',
  LOGIN_DONE = '[SETTINGS] LOGIN_DONE',
  PRIME_SETTINGS = '[SETTINGS] PRIME_SETTINGS',
  NAV_SETTINGS = '[SETTINGS] NAV_SETTINGS',
  NAV_HOME = '[SETTINGS] NAV_SETTINGS',
  SET_LOGINDATA_NAV_HOME = '[SETTINGS] SET_LOGINDATA_NAV_HOME',
  SET_SERVERADDRESS = '[SETTINGS] SET_SERVERADDRESS',
  SET_SERVERADDRESS_DONE = '[SETTINGS] SET_SERVERADDRESS_DONE',
  SHOW_SETSERVER_MODAL = '[SETTINGS] SHOW_SETSERVER_MODAL',
  GET_APP_SETTINGS = '[SETTINGS] GET_APP_SETTINGS',
  SET_APP_SETTINGS = '[SETTINGS] SET_APP_SETTINGS',
  DONE = '[SETTINGS] DONE',
  SAVE_PERFER_DARKMODE_SETTING = '[SETTINGS] SAVE_PERFER_DARKMODE_SETTING',
  SAVE_PERFER_DARKMODE_SETTING_DONE = '[SETTINGS] SAVE_PERFER_DARKMODE_SETTING_DONE',
  SAVE_KEEP_ALIVE_SETTING = '[SETTINGS] SAVE_KEEP_ALIVE_SETTING',
  SHOW_LOGOUTPROMPT = '[SETTINGS] SHOW_LOGOUTPROMPT',
  LOGOUT = '[SETTINGS] LOGOUT',
  SHOW_ABOUT_MODAL = '[SETTINGS] SHOW_ABOUT_MODAL',
  SET_IS_APP_ACTIVE = '[SETTINGS] SET_IS_APP_ACTIVE',
  DISMISS_MODAL = '[SETTINGS] DISMISS_MODAL',
  GET_APP_SETTINGS_FROM_SERVER = '[SETTINGS] GET_APP_SETTINGS_FROM_SERVER',
  GET_APP_SETTINGS_FROM_SERVER_DONE = '[SETTINGS] GET_APP_SETTINGS_FROM_SERVER_DONE',
}

export class ShowLoginModal implements Action {
  readonly type = SettingActionTypes.SHOW_LOGIN_MODAL;
  constructor() {}
}

export class Login implements Action {
  readonly type = SettingActionTypes.LOGIN;
  constructor(public payload: LoginPayload) {}
}

export class LoginSuccess implements Action {
  readonly type = SettingActionTypes.LOGIN_SUCCESS;
  constructor(public user: UserInfo) {}
}

export class LoginFail implements Action {
  readonly type = SettingActionTypes.LOGIN_FAIL;
  constructor(public payload: string) {}
}

export class IsLogin implements Action {
  readonly type = SettingActionTypes.IS_LOGIN;
}

export class LoginDone implements Action {
  readonly type = SettingActionTypes.LOGIN_DONE;
}

export class PrimeSettings implements Action {
  readonly type = SettingActionTypes.PRIME_SETTINGS;
  constructor() {}
}

export class NavigateToSettings implements Action {
  readonly type = SettingActionTypes.NAV_SETTINGS;
}

export class NavigateToHome implements Action {
  readonly type = SettingActionTypes.NAV_HOME;
}

export class SetLoginDataAndNavigateToHome implements Action {
  readonly type = SettingActionTypes.SET_LOGINDATA_NAV_HOME;
  constructor(public user: UserInfo, public enablePushNotifications: boolean,
    public themePreference: number, public keepAlive: boolean, public headsetType: number,
    public backgroundGeolocationEnabled: boolean) {}
}

export class SetServerAddress implements Action {
  readonly type = SettingActionTypes.SET_SERVERADDRESS;
  constructor(public serverAddress: string) {}
}

export class SetServerAddressDone implements Action {
  readonly type = SettingActionTypes.SET_SERVERADDRESS_DONE;
  constructor() {}
}

export class ShowSetServerModal implements Action {
  readonly type = SettingActionTypes.SHOW_SETSERVER_MODAL;
  constructor() {}
}

export class SavePerferDarkModeSetting implements Action {
  readonly type = SettingActionTypes.SAVE_PERFER_DARKMODE_SETTING;
  constructor(public themePreference: number) {}
}

export class SavePerferDarkModeSettingDone implements Action {
  readonly type = SettingActionTypes.SAVE_PERFER_DARKMODE_SETTING_DONE;
  constructor(public themePreference: number) {}
}

export class SaveKeepAliveSetting implements Action {
  readonly type = SettingActionTypes.SAVE_KEEP_ALIVE_SETTING;
  constructor(public keepAlive: boolean) {}
}

export class GetApplicationSettings implements Action {
  readonly type = SettingActionTypes.GET_APP_SETTINGS;
  constructor() {}
}

export class SetApplicationSettings implements Action {
  readonly type = SettingActionTypes.SET_APP_SETTINGS;
  constructor(public enablePushNotifications: boolean, public themePreference: number, public keepAlive: boolean,
    public headsetType: number, public selectedMic: string) {}
}

export class ShowPromptForLogout implements Action {
  readonly type = SettingActionTypes.SHOW_LOGOUTPROMPT;
  constructor() {}
}

export class Logout implements Action {
  readonly type = SettingActionTypes.LOGOUT;
  constructor() {}
}

export class Done implements Action {
  readonly type = SettingActionTypes.DONE;
  constructor() {}
}

export class ShowAboutModal implements Action {
  readonly type = SettingActionTypes.SHOW_ABOUT_MODAL;
  constructor() {}
}

export class SetIsAppActive implements Action {
  readonly type = SettingActionTypes.SET_IS_APP_ACTIVE;
  constructor(public isActive: boolean) {}
}

export class DismissModal implements Action {
  readonly type = SettingActionTypes.DISMISS_MODAL;
  constructor() {}
}

export class GetAppSettingsFromServer implements Action {
  readonly type = SettingActionTypes.GET_APP_SETTINGS_FROM_SERVER;
  constructor() {}
}

export class GetAppSettingsFromServerDone implements Action {
  readonly type = SettingActionTypes.GET_APP_SETTINGS_FROM_SERVER_DONE;
  constructor(public appSettings: GetConfigResultData) {}
}

export type SettingsActionsUnion =
  | ShowLoginModal
  | Login
  | LoginSuccess
  | LoginFail
  | IsLogin
  | LoginDone
  | PrimeSettings
  | NavigateToSettings
  | NavigateToHome
  | SetLoginDataAndNavigateToHome
  | SetServerAddress
  | SetServerAddressDone
  | ShowSetServerModal
  | GetApplicationSettings
  | SetApplicationSettings
  | Done
  | SavePerferDarkModeSetting
  | SaveKeepAliveSetting
  | ShowPromptForLogout
  | Logout
  | ShowAboutModal
  | SetIsAppActive
  | GetAppSettingsFromServer
  | GetAppSettingsFromServerDone
  | DismissModal
  | SavePerferDarkModeSettingDone
  ;
