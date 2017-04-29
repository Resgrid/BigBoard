import { Injectable, Inject } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";
import 'rxjs/add/operator/map';

import { Consts } from '../app/consts';
import { AuthValidateResult } from '../models/authValidateResult';

@Injectable()
export class AuthProvider {

  constructor(private http: Http, private consts: Consts, @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig) {}

  public login(username: string, password: string): Observable<AuthValidateResult> {
      return this.http.post(this.appConfig.ResgridApiUrl + '/Auth/Validate', {
        usr: username,
        Pass: password
      }, new RequestOptions({ headers: new Headers({ 'Accept': 'application/json' }) })).map(res => res.json());
   }
}