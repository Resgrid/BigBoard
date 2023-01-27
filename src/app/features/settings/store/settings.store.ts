import { HeadsetType } from "src/app/models/headsetType";
import { UserInfo } from "src/app/models/userInfo";

export interface SettingsState {
    loggedIn: boolean;
    errorMsg: string | null;
    isLogging: boolean;
    user: UserInfo | null;
    perferDarkMode: boolean;
    keepAlive: boolean;
    isAppActive: boolean;
}

export const initialState: SettingsState = {
    loggedIn: false,
    errorMsg: null,
    isLogging: false,
    user: null,
    perferDarkMode: false,
    keepAlive: false,
    isAppActive: true,
};
