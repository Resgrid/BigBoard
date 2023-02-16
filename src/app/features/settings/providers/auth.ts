import { Injectable, Inject } from "@angular/core";
import { combineLatest, concat, Observable, of, Subscription } from "rxjs";
import {
  AuthService,
  ProfileModel,
  SecurityService,
} from '@resgrid/ngx-resgridlib';
import { map, mergeMap } from "rxjs/operators";
import { LoginResult } from "src/app/models/loginResult";

@Injectable({
  providedIn: "root",
})
export class AuthProvider {
  private refreshTokenSub: Subscription;

  constructor(
    private authProvider: AuthService,
    private securityService: SecurityService
  ) {}

  public login(username: string, password: string): Observable<LoginResult> {
    const login = this.authProvider.login({
      username: username,
      password: password,
      refresh_token: "",
    });
    const getDepartmentRights = this.securityService.applySecurityRights();

    return login.pipe(
      mergeMap((loginResult) => {
        return combineLatest([of(loginResult), getDepartmentRights]);
      }),
      map(([loginResult, rightsResult]) => {
        let result: LoginResult = loginResult as LoginResult;
        result.Rights = rightsResult.Data;

        return result;
      })
    );
  }

  public startTrackingRefreshToken(): void {
    this.refreshTokenSub = this.authProvider.init().subscribe(result => {
      //console.log(JSON.stringify(result));
    });
  }

  public refreshTokens() {
    return this.authProvider.refreshTokens();
  }

  public logout() {
    this.authProvider.logout();
  }
}
