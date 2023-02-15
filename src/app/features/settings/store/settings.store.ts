import { GetConfigResultData } from "@resgrid/ngx-resgridlib";
import { HeadsetType } from "src/app/models/headsetType";
import { UserInfo } from "src/app/models/userInfo";

export interface SettingsState {
    loggedIn: boolean;
    errorMsg: string | null;
    isLogging: boolean;
    user: UserInfo | null;
    keepAlive: boolean;
    isAppActive: boolean;
    appSettings: GetConfigResultData;
    themePreference: number;
}

export const initialState: SettingsState = {
    loggedIn: false,
    errorMsg: null,
    isLogging: false,
    user: null,
    keepAlive: false,
    isAppActive: true,
    appSettings: new GetConfigResultData(),
    themePreference: -1,
};
