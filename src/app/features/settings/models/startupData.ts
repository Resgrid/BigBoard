import { LoginResult } from 'src/app/models/loginResult';

export class StartupData {
  public loginData: LoginResult = new LoginResult();
  public perferDarkMode: number = -1;
  public keepAlive: boolean = false;
}
