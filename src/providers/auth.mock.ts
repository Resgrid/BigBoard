import { Observable } from "rxjs/Observable";
import { Consts } from '../app/consts';
import { AuthValidateResult } from '../models/authValidateResult';

export class AuthProviderMock {
  public login(username: string, password: string): Observable<AuthValidateResult> {
      return Observable.of(new AuthValidateResult());
   }
}