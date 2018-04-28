import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs/Observable";
import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";
import 'rxjs/add/operator/map';

import { AuthValidateResult } from '../models/authValidateResult';

@Injectable()
export class AuthProvider {

  constructor(private http: HttpClient, @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig) {}

   public login(username: string, password: string): Observable<AuthValidateResult> {
    return this.http.post<AuthValidateResult>(this.appConfig.ResgridApiUrl + '/Auth/Validate', {
      usr: username,
      Pass: password
    });
  }
}