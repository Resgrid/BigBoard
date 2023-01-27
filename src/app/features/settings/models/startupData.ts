import { LoginResult } from "src/app/models/loginResult";

export class StartupData  {
    public loginData: LoginResult = new LoginResult();
    public perferDarkMode: boolean = false;
    public keepAlive: boolean = false;
}
